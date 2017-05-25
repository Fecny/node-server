var mqttConfig = require('../config/mqtt')
    , mqtt = require('mqtt');

var mqttClient = mqtt.connect(mqttConfig.connection);
var debugMessages = false;


function setDebug(message){
    if(debugMessages) {
        console.info(message);
    }
}

mqttClient.subscribe('cells/+/devices/+/out/data');

mqttClient.on('message', function (topic, message) {
    var deviceDataFromTopic = topic.split("/");
    var deviceID = deviceDataFromTopic[4];
    process.send({messageType: 'basic-operating-data', deviceID: deviceID, message: message.toString()});
});
