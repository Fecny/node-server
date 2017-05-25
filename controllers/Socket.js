var models  = require('../models');
var SQLQueries = require('../config/sql_queries');

module.exports = function(io) {
    // NET METHODS
    var sendDevices = function(socket, cell_id){
        var getDevicesQuery = SQLQueries["get-devices-cell"].replace('<!selected_cell!>', cell_id);
        global.sequelize.query(getDevicesQuery,{type: sequelize.QueryTypes.SELECT}).then(function (devices) {
            socket.emit("receive_devices", devices);
        });
    };

    var sendCells = function(socket, factory_id){
        var getDevicesQuery = SQLQueries["get-cells-factory"].replace('<!factory_id!>', factory_id);
        global.sequelize.query(getDevicesQuery,{type: sequelize.QueryTypes.SELECT}).then(function (cells) {
            socket.emit("receive_cells", cells);
        });
    };

    var sendNotifications = function(socket){
        var add_where = "";
        if(global.hasOwnProperty("session") && global.session.hasOwnProperty("selected_device") && global.session.selected_device !== null) {
            add_where = " AND err_dev_id = '"+global.session.selected_device+"'";
        }
        global.sequelize.query("SELECT * from tberroractive WHERE err_active = 1"+add_where,{type: sequelize.QueryTypes.SELECT}).then(function (notify) {
            socket.emit("receive_notifications", notify)
        });
    };


    // setter for one elements
    var setFactory = function(socket, factory_id){
        models.Factory.findOne({
            where: {fact_id: factory_id},
            include: [{all: true}]
        }).then(function (factoryData) {
            if (factoryData) {
                setTimeout(function() {
                    socket.emit("set_factory", factoryData);
                },50);
                sendCells(socket, factory_id);
            }
        });
    };
    var setCell = function(socket, cell_id){
        global.sequelize.query(SQLQueries["get-cells-id"].replace('<!cell_id!>', cell_id), {type: sequelize.QueryTypes.SELECT}).then(function (cellData) {
            setTimeout(function(){socket.emit("set_cell", cellData[0]);},60);
            setTimeout(function(){sendDevices(socket, cell_id);},70);
        });
    };
    var setDevice = function(socket, device_id){
        global.sequelize.query(SQLQueries["get-devices-id"].replace('<!device_id!>', device_id), {type: sequelize.QueryTypes.SELECT}).then(function (deviceData) {
            socket.leaveAll();
            socket.join('deviceRoom_'+device_id);
            setTimeout(function(){
                socket.emit("set_device", deviceData[0]);
                sendNotifications(socket);
            },80);
        });
    };





    io.on('connection', function (socket) {
        global.io.socket = socket;

        socket.on("set_factory", function(factory_id){
            // send back cells for factory
            setFactory(socket, factory_id);
        });
        socket.on("set_cell", function(cell_id){
            // send back devices for factory
            setCell(socket, cell_id);
        });
        socket.on("set_device", function(device_id){
            setDevice(socket, device_id);
        });

        // ONLOAD SETTERS
        sendNotifications(socket);
        // If socket has selected factory
        if(global.hasOwnProperty("session") && global.session.hasOwnProperty("selected_factory") && global.session.selected_factory !== null) {
            setFactory(socket, global.session.selected_factory);
        }
        // If socket has selected cell
        if(global.hasOwnProperty("session") && global.session.hasOwnProperty("selected_cell") && global.session.selected_cell !== null) {
            setCell(socket, global.session.selected_cell);
        }

        // If socket has selected device
        if(global.hasOwnProperty("session") && global.session.hasOwnProperty("selected_device") && global.session.selected_device !== null) {
            setDevice(socket, global.session.selected_device);
        }
    });


};

