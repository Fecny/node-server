"use strict";

module.exports = function(sequelize, DataTypes) {
  var Account = sequelize.define("Account", {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    session: DataTypes.STRING
  }, {
    tableName: 'accounts',
    classMethods: {
      associate: function(models) {
        // User.hasMany(models.Task)
      }
    }
  });

  return Account;
};
