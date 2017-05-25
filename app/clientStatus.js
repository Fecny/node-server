/**
 * Created by Fecny on 2017. 03. 17..
 */
var mqttConfig = require('../config/mqtt')
    , mysql = require('mysql')
    , dbconfig = require('../config/database')
    , mysqlPool = mysql.createPool(dbconfig.connection)
    , mqtt = require('mqtt');

var mqttClient = mqtt.connect(mqttConfig.connection);
var debugMessages = false;

function setDebug(message){
    if(debugMessages) {
        console.info(message);
    }
}

function subscribeToTopics() {
    mqttClient.subscribe('cells/+/devices/+/out/online');
    mqttClient.subscribe('cells/+/out/online');
}

subscribeToTopics();

mysqlPool.getConnection(function (poolerr, connection) {
    if (poolerr) {
        console.error("Az adatbázis szerver visszautasította a kapcsolatot, a statusznode leáll!");
    } else {
        mqttClient.on('message', function (topic, message) {

            var cell_id = null;
            var device_id = null;

            var re1 = '.*?';
            var re2 = '(\\d+)';
            var re3 = '.*?';
            var re4 = '(\\d+)';

            var p = new RegExp(re1 + re2 + re3 + re4, ["i"]);
            var m = p.exec(topic);
            if (m != null) {
                cell_id = m[1];
                device_id = m[2];
            } else {
                var p2 = new RegExp(re1 + re2, ["i"]);
                var m2 = p2.exec(topic);
                if (m2 != null) {
                    cell_id = m2[1];
                }
            }
            var status = message.toString();

            connection.query("SET timezone = 'GMT'");

            if (device_id == null) {
                connection.query('SELECT * from cellStatus WHERE cell_id = ?', [cell_id], function (err, rows, fields) {
                    if (rows["RowDataPacket"] !== undefined) {
                        var updateKieg = ", last_online = NOW()";
                        connection.query('UPDATE cellStatus SET status = "' + status + '"' + updateKieg + ' WHERE cell_id = "' + cell_id + '"');
                    } else {
                        connection.query('INSERT into cellStatus (cell_id, status, last_online) values ("' + cell_id + '", "' + status + '", NOW())');
                    }
                });
                process.send({messageType: 'cellStatusChange', cell_id: cell_id, status: status});
                setDebug("Update cellStatus (" + cell_id + ")");
            } else {
                connection.query('SELECT * from deviceStatus WHERE device_id = ?', [device_id], function (err, rows, fields) {
                    if (rows["RowDataPacket"] !== undefined) {
                        var updateKieg = ", last_online = NOW()";
                        connection.query('UPDATE deviceStatus SET status = "' + status + '"' + updateKieg + ' WHERE device_id = "' + device_id + '"');
                    } else {
                        connection.query('INSERT into deviceStatus (device_id, status, last_online) values ("' + device_id + '", "' + status + '", NOW())');
                    }
                });
                process.send({messageType: 'deviceStatusChange', device_id: device_id, status: status});
                setDebug("Update deviceStatus (" + device_id + ")");
            }
        });
    }
});