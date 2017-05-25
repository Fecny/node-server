var models = require('../../models/index');
var crypto = require('crypto');
var Mailer = require('../../controllers/Mailer');
var bcrypt = require('bcrypt-nodejs');
var SQLQueries = require('../../config/sql_queries');

app.get('/admin/accounts', isLoggedInRedirect, function (req, res) {
    global.sequelize.query("SELECT * FROM accounts", {type: sequelize.QueryTypes.SELECT}).then(function (accountsData) {
        res.render('pages/admin/accounts/main.ejs', {
            account: req.user,
            accountsData: accountsData,
            message: ""
        });
    });
});


// ACCOUNT EDIT METHODS
app.get('/admin/accounts/:id(\\d+)/edit', isLoggedInRedirect, function (req, res) {
    var message = "";
    if (req.session.statusMessage) {
        message = req.session.statusMessage;
        req.session.statusMessage = false;
    }
    global.sequelize.query(SQLQueries["get-account"].replace('<!account_id!>', req.params.id), {type: sequelize.QueryTypes.SELECT}).then(function (accountsData) {
        global.sequelize.query("SELECT * FROM roles", {type: sequelize.QueryTypes.SELECT}).then(function (rolesData) {
        global.sequelize.query("SELECT tbfactory.*, factory_datas.* FROM tbfactory INNER JOIN factory_datas on(tbfactory.fact_id = factory_datas.factory_id)", {type: sequelize.QueryTypes.SELECT}).then(function (factoriesData) {
            res.render('pages/admin/accounts/edit.ejs', {
                account: req.user,
                accountsData: accountsData,
                rolesData: rolesData,
                factoriesData: factoriesData,
                factories: req.app.locals.factories,
                message: message
            });
        });
        });
    });
});
app.post('/admin/accounts/:id(\\d+)/edit', isLoggedInRedirect, function (req, res) {


    var accountsData = req.body.account;
    var account_roles = req.body.account_roles;
    var account_factories = req.body.account_factories;

    // save accounts base data
    var updateString = [];
    Object.keys(accountsData).forEach(function (key) {
        var val = accountsData[key];
        updateString.push(key + "='" + val + "'");
    });


    global.sequelize.query("UPDATE accounts SET " + updateString.join(", ") + " WHERE accounts.id = '" + req.params.id + "'", {type: sequelize.QueryTypes.UPDATE});


    // process account roles
    global.sequelize.query("DELETE from account_roles WHERE accounts_id = '" + req.params.id + "'", {type: sequelize.QueryTypes.DELETE}).then(function () {
        if (account_roles.roles_id > 0) {
            global.sequelize.query("INSERT into account_roles VALUES (null, '" + req.params.id + "', '" + account_roles.roles_id + "');");
        }
    });


    // process account factories
    global.sequelize.query("DELETE from account_factories WHERE accounts_id = '" + req.params.id + "'", {type: sequelize.QueryTypes.DELETE}).then(function () {

        if ((account_factories !== null && account_factories !== undefined)) {
            if (Object.keys(account_factories).length > 0) {
                Object.keys(account_factories).forEach(function (key) {
                    var val = account_factories[key];
                    global.sequelize.query("INSERT into account_factories VALUES (null, '" + req.params.id + "', '" + val + "');");
                });
            }
        }
    });

    // force user to re login for obtain new roles / factories
    if(req.user.id === req.params.id){
        req.login(req.user, function(){});
    }

    // then re-query them to pass view template
    global.sequelize.query(SQLQueries["get-account"].replace('<!account_id!>', req.params.id), {type: sequelize.QueryTypes.SELECT}).then(function (accountsData) {
        global.sequelize.query("SELECT * FROM roles", {type: sequelize.QueryTypes.SELECT}).then(function (rolesData) {
            global.sequelize.query("SELECT tbfactory.*, factory_datas.* FROM tbfactory INNER JOIN factory_datas on(tbfactory.fact_id = factory_datas.factory_id)", {type: sequelize.QueryTypes.SELECT}).then(function (factoriesData) {
            res.render('pages/admin/accounts/edit.ejs', {
                account: req.user,
                accountsData: accountsData,
                factoriesData: factoriesData,
                rolesData: rolesData,
                factories: req.app.locals.factories,
                message: "ok"
            });
        });
        });
    });
});


// ACCOUNT DELETE METHODS
app.get('/admin/accounts/:id(\\d+)/delete', isLoggedInRedirect, function (req, res) {
    global.sequelize.query("DELETE from accounts WHERE accounts.id = '" + req.params.id + "'", {type: sequelize.QueryTypes.DELETE}).then(function () {
        global.sequelize.query("DELETE from account_roles WHERE accounts_id = '" + req.params.id + "'", {type: sequelize.QueryTypes.DELETE}).then(function () {
            global.sequelize.query("DELETE from account_factories WHERE accounts_id = '" + req.params.id + "'", {type: sequelize.QueryTypes.DELETE}).then(function () {
                res.redirect('/admin/accounts');
            });
        });
    });
});


// ACCOUNT EDIT METHODS
app.get('/admin/accounts/new', isLoggedInRedirect, function (req, res) {
    global.sequelize.query("SELECT * FROM roles", {type: sequelize.QueryTypes.SELECT}).then(function (rolesData) {
        global.sequelize.query("SELECT tbfactory.*, factory_datas.* FROM tbfactory INNER JOIN factory_datas on(tbfactory.fact_id = factory_datas.factory_id)", {type: sequelize.QueryTypes.SELECT}).then(function (factoriesData) {
        res.render('pages/admin/accounts/new.ejs', {
            account: req.user,
            accountsData: {},
            factoriesData: factoriesData,
            rolesData: rolesData,
            factories: req.app.locals.factories,
            message: ""
        });
    });
    });
});
app.post('/admin/accounts/new', isLoggedInRedirect, function (req, res) {


    var accountsData = req.body.account;
    var account_roles = req.body.account_roles;
    var account_factories = req.body.account_factories;
    var randomPassword = Math.random().toString(36).slice(-8);
    var newPassword = bcrypt.hashSync(randomPassword, null, null);

    // save accounts base data
    var insertFields = ["id", "password", "created"];
    var insertValues = ["null", "'" + newPassword + "'", "NOW()"];

    Object.keys(accountsData).forEach(function (key) {
        var val = accountsData[key];
        insertFields.push(key);
        insertValues.push("'" + val + "'");
    });

    var insertedAccountID = null;
    global.sequelize.query("INSERT into accounts (" + insertFields.join(',') + ") VALUES (" + insertValues.join(',') + ")", {type: sequelize.QueryTypes.INSERT}).then(function (returnData) {
        insertedAccountID = returnData;


        // process account roles
        if (account_roles.roles_id > 0) {
            global.sequelize.query("INSERT into account_roles VALUES (null, '" + insertedAccountID + "', '" + account_roles.roles_id + "');");
        }

        // process account factories
        if ((account_factories !== null && account_factories !== undefined)) {
            if (Object.keys(account_factories).length > 0) {
                Object.keys(account_factories).forEach(function (key) {
                    var val = account_factories[key];
                    global.sequelize.query("INSERT into account_factories VALUES (null, '" + insertedAccountID + "', '" + val + "');");
                });
            }
        }

        // send welcome e-mail to new account
        var welcomeEmail = {
            'subject': 'Üdvözöljük a nodeserver-ban',
            'email': accountsData['email'],
            'password': randomPassword,
            'account_name': accountsData.name,
        };
        Mailer.sendMail(welcomeEmail.email, welcomeEmail.subject, "new-account", welcomeEmail);


        // redirect to edit page
        req.session.statusMessage = "Felhasználó létrejött!";
        res.redirect('/admin/accounts/' + insertedAccountID + '/edit');
    });
});


// ACCOUNT DELETE METHODS
app.get('/admin/accounts/:id(\\d+)/delete', isLoggedInRedirect, function (req, res) {
    global.sequelize.query("DELETE from accounts WHERE accounts.id = '" + req.params.id + "'", {type: sequelize.QueryTypes.DELETE}).then(function () {
        global.sequelize.query("DELETE from account_roles WHERE accounts_id = '" + req.params.id + "'", {type: sequelize.QueryTypes.DELETE}).then(function () {
            global.sequelize.query("DELETE from account_factories WHERE accounts_id = '" + req.params.id + "'", {type: sequelize.QueryTypes.DELETE}).then(function () {
                res.redirect('/admin/accounts');
            });
        });
    });
});


// ACCOUNT PASSWORD RESET METHODS
app.get('/admin/accounts/:id(\\d+)/password_reset', isLoggedInRedirect, function (req, res) {
    global.sequelize.query("SELECT accounts.*, (SELECT group_concat(account_roles.roles_id separator '|') from account_roles WHERE account_roles.accounts_id = accounts.id) as account_roles, (SELECT group_concat(account_factories.factory_id separator '|') from account_factories WHERE account_factories.accounts_id = accounts.id) as account_factories FROM accounts WHERE accounts.id = '" + req.params.id + "'", {type: sequelize.QueryTypes.SELECT}).then(function (accountsData) {

        var token = crypto.randomBytes(12).toString('hex');

        global.sequelize.query("INSERT into password_reset VALUES (null, '" + accountsData[0]['id'] + "', '" + token + "', NOW())", {type: sequelize.QueryTypes.INSERT}).then(function () {
            var passwordResetMail = {
                'subject': 'Jelszó visszaállítási varázsló',
                'email': accountsData[0]['email'],
                'when': moment().format(),
                'account_name': accountsData[0].name,
                'password_reset_url': 'https://' + req.headers.host + '/password-reset/' + token
            };
            Mailer.sendMail(passwordResetMail.email, passwordResetMail.subject, "password-reset", passwordResetMail);

            res.redirect('/admin/accounts/' + req.params.id + '/edit');
        });
    });
});