var port     		= process.env.PORT || 9000; // define app port
console.info('Setting up NodeJS Server...');
require('events').EventEmitter.prototype._maxListeners = 0;
var   express  		= require('express')
	, session  		= require('express-session')
	, spdy 			= require('spdy')
	, fs 			= require('fs')
	, cookieParser	= require('cookie-parser')
	, bodyParser	= require('body-parser')
	, morgan		= require('morgan')
	, passport		= require('passport')
	, mqttConfig	= require('./config/mqtt')
	, mqtt 			= require('mqtt')
	, fork 			= require('child_process').fork
	, flash			= require('connect-flash');

var options = {
    key: fs.readFileSync(__dirname + '/server.key'),
    cert:  fs.readFileSync(__dirname + '/server.crt')
};

var   app = express()
	, http			= require('http')
	// , server		= http.createServer(app)
	, server		= spdy.createServer(options,app) // for SPeeDY load (HTTP/2)
	, io			= require('socket.io').listen(server, {"transports":["websocket", "flashsocket", "polling"]})
	, i18n			= require('i18n')
	, mysql			= require('mysql')
	, Sequelize 	= require("sequelize")
	, timeout		= require('connect-timeout')
	, dbconfig		= require('./config/database')
	, Mailer		= require('./controllers/Mailer')
	, moment		= require('moment')
	, mysqlPool		= mysql.createPool(dbconfig.connection)
	, MemcachedStore= require('connect-memcached')(session)
	, Memcached 	= require('memcached')
    , memcached 	= new Memcached('127.0.0.1:11211')
	, dateFormat	= "YYYY. MM. DD. HH:mm:ss";

var sessionMiddleware = session({
    secret: 'nodeserverV2AppSeCrEt',
    resave: true,
    store   : new MemcachedStore({
        hosts: ['127.0.0.1:11211']
    }),
    saveUninitialized: true
});


var SqlString = require('sequelize/lib/sql-string');

global.mysqlPool = mysqlPool;
global.app = app;
global.passport = passport;

global.selected_factory = 0;
global.selected_cell = 0;
global.selected_device = 0;

global.io = io;
global.socket = null;
global.moment = moment;

io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

global.toLang = function(string){
	return __(string);
};

console.info('Waiting for MySql connection...');


require('./controllers/Socket')(io);


i18n.configure({
	locales: ['en', 'hu'],
	cookie: 'nodeserver_language',
	register: global,
	directory: __dirname+'/locales',
	autoReload: true
});
console.info('Setting up language support...');
i18n.setLocale('hu');

require('./config/language')(i18n); 				// require language controller
require('./config/passport')(passport,mysqlPool,memcached); 	// require passport controller

// set up app parameters (cookies, static dirs)
require('./config/app')(app, cookieParser, express, bodyParser, session, passport, flash, morgan, sessionMiddleware);


var routes  = require('./routes');

app.use(function(req, res) {
	res.render('pages/error/main.ejs');
});

var __ = require("i18n").__;

var models  = require('./models/index');
var SQLQueries = require('./config/sql_queries');
console.info('Start Node statusmonitor...');
// start statusmonitor node
var statusMonitor = fork('./app/clientStatus', {io: io});
statusMonitor.on('message', function (statusData) {
	if(statusData.messageType === "deviceStatusChange") {
        models.sequelize.query(SQLQueries["get-devices-id"].replace('<!device_id!>', statusData.device_id), {type: sequelize.QueryTypes.SELECT}).then(function (DeviceDataDB) {
            io.sockets.emit("changeDeviceStatus", {device_data: DeviceDataDB[0], device_id: statusData.device_id, status: statusData.status});
        });
    }
	if(statusData.messageType === "cellStatusChange") {
        global.sequelize.query(SQLQueries["get-cells-id"].replace('<!cell_id!>', statusData.cell_id), {type: sequelize.QueryTypes.SELECT}).then(function (cellData) {
            io.sockets.emit("changeCellStatus", {cell_data: cellData[0], cell_id: statusData.cell_id, status: statusData.status});
        });
    }
});


var programStatusFork = fork('./app/programStatus', {io: io});
programStatusFork.on('message', function (deviceData) {
    if(deviceData.messageType === "programstatus") {
        models.sequelize.query(SQLQueries["get-devices-id"].replace('<!device_id!>', deviceData.deviceID), {type: sequelize.QueryTypes.SELECT}).then(function (DeviceDataDB) {
            io.sockets.emit("getProgramStatus", {device_data: DeviceDataDB[0], device_id: deviceData.deviceID, status: deviceData.message});
        });
    }
});

var mqttClientFork = fork('./app/MQTTData', {io: io});
mqttClientFork.on('message', function (deviceData) {
    if(deviceData.messageType === "basic-operating-data") {
        global.io.to('deviceRoom_'+deviceData.deviceID).emit("basic-operating-data", {deviceID: deviceData.deviceID, message: deviceData.message});
    }
});

var licenceStatusFork = fork('./app/licenceStatus', {io: io});

console.info('StatusMonitor started!');


mysqlPool.getConnection(function(poolerr, connection) {
	if(poolerr){
		console.error("Az adatbázis szerver visszautasította a kapcsolatot, az alkalmazás leáll!");
        return process.exit(1);
	}else{
        server.listen(port, function (error) {
            if(error) {
                console.error(error);
                return process.exit(1);
            }else{
                console.info('A vezérlőpult sikeresen elindult a következő porton: ' + port   );
            }
        });
	}
});
