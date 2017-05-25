"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var dbconfig  = require('../config/database')

var sequelize = new Sequelize(dbconfig.connection.database, dbconfig.connection.user, dbconfig.connection.password, {
    host: dbconfig.connection.host,
    dialect: 'mysql',
    dialectOptions: {
        useUTC: false //for reading from database
    },
    timezone: '+02:00',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    logging: false
});

var db        = {};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

global.sequelize = sequelize;

module.exports = db;