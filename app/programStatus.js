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

    var processData = JSON.parse(message.toString());
    if(processData.hasOwnProperty("io status")) {
        var ioStatuses = processData["io status"];

        var programIsRunning = false;
        var hasProgramError = false;
        ioStatuses.forEach(function(el, index) {
            if(((el.type === "UO" && el.index == "3") || (el.type === "SO" && el.index == "1")) && el.state == 1){
                programIsRunning = true;
            }
            if(((el.type === "UO" && el.index == "6") || (el.type === "SO" && el.index == "3")) && el.state == 1){
                hasProgramError = true;
            }

        });

        process.send({messageType: 'programstatus', deviceID: deviceID, message: {programIsRunning: programIsRunning, hasProgramError: hasProgramError}});
    }
});
