var mysql = require('mysql')
    , dbconfig = require('../config/database')
    , Sequelize 	= require("sequelize")
    , mysqlPool = mysql.createPool(dbconfig.connection);

var Mailer = require('../controllers/Mailer');

var models = require('../models');
var schedule = require('node-schedule');


var select_maturingLicences = "SELECT tbcell.*, (SELECT short_name FROM factory_datas WHERE factory_id = cell_fact_id) AS short_name,licences.licence_id,licences.licence_number,CAST(licences.`start` AS CHAR) AS licence_start,CAST(licences.`end` AS CHAR) AS licence_end,DATEDIFF(NOW(), licences.`end`) AS licence_end_diff,DATEDIFF(NOW(), licence_notifications.notification_time) AS last_notificated FROM tbcell LEFT OUTER JOIN licences ON (licence_id = (SELECT licence_id FROM licences WHERE licences.cell_id = tbcell.cell_id ORDER BY licences.`end` DESC LIMIT 1)) LEFT OUTER JOIN licence_notifications ON (licence_notifications.licence_notification_id = (SELECT licence_notification_id FROM licence_notifications WHERE licence_notifications.licence_id = licences.licence_id ORDER BY notification_time DESC LIMIT 1))WHERE DATEDIFF(NOW(), licences.`end`) >= - 30 AND DATEDIFF(NOW(), licences.`end`) < 0 ORDER BY cell_fact_id,cell_name";


// send notifications on all mondays
var j = schedule.scheduleJob('0 8 * * *', function(){
    models.sequelize.query(select_maturingLicences, {type: sequelize.QueryTypes.SELECT}).then(function (licenceData) {
        licenceData.forEach(function(licence){
            if(licence.last_notificated === null || licence.last_notificated >= 7){
                // get all account for that cell
                models.sequelize.query("SELECT accounts.name, accounts.email from accounts WHERE id in (SELECT account_factories.accounts_id FROM account_factories WHERE account_factories.factory_id = '"+licence.cell_fact_id+"')", {type: sequelize.QueryTypes.SELECT}).then(function (accountsData) {
                    accountsData.forEach(function(accountData){
                        var licenceEmail = {
                            'subject': licence.short_name+"/"+licence.cell_name+" cella licence hamarosan lejár",
                            'email': accountData.email,
                            'account_name': accountData.name,
                            'cell_long_name': licence.short_name+"/<strong>"+licence.cell_name+"</strong>",
                            'cell_short_name': licence.cell_name,
                            'days_remaining': Math.abs(licence.licence_end_diff)
                        };
                        Mailer.sendMail(licenceEmail.email, licenceEmail.subject, "licence-notification", licenceEmail);
                    });
                });
                models.sequelize.query("INSERT into licence_notifications VALUES (null, '"+licence.licence_id+"', NOW());", {type: sequelize.QueryTypes.INSERT});
            }
        });
    });
});