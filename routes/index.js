var routes = {};
var fs = require("fs");
var path = require("path");
var models = require('../models');
var passport = require('passport');

var excludedURLs = ["dashboard", "feedback", "changelog", "logout", "forte"];

isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated())
        return true

    return false;
};


redirectDashboard = function (req, res, next) {
    res.redirect('/dashboard');
};

hasRights = function (req, res, next) {
    var accountID = req.user.id;
    var accountRoleID = req.user.account_roles;


    var string = req.url,
        substring = "ajax";
    var isAjaxRequest = false;
    if (string.indexOf(substring) !== -1) {
        isAjaxRequest = true;
    }

    var requestURL = req.originalUrl.slice(1);

    var genURL = "";
    var splittedURL = requestURL.split("/");

    genURL = splittedURL[0];
    if(splittedURL[0] === "admin") {
        genURL = genURL + "/" + splittedURL[1];
    }else{
        if ((splittedURL[1] !== undefined && splittedURL[1] !== "new") && (splittedURL[2] !== "edit")) {
            genURL = genURL + "/" + splittedURL[1];
        }
    }
    if (excludedURLs.indexOf(genURL) === -1 && !isAjaxRequest) {
        models.sequelize.query("SELECT count(roles_levels_id) as foundROWS FROM roles_levels WHERE roles_id = '" + accountRoleID + "' AND level LIKE '" + genURL + "'", {type: sequelize.QueryTypes.SELECT}).then(function (RoleData) {
            if (parseInt(RoleData[0]['foundROWS']) === 0) {
                redirectDashboard(req, res, next);
            } else {
                return next();
            }
        });
    } else {
        return next();
    }
};


isLoggedInRedirect = function (req, res, next) {
    if (req.originalUrl !== "/login") {
        req.session.last_page = req.originalUrl;
    }

    if (req.isAuthenticated()) {
        hasRights(req, res, next);
    } else {
        res.redirect('/login');
    }
};


app.get('*', function (req, res) {
    req.login(req.user, function(){});

    global.session = req.session;

    var reqNextSleep = 1;
    var string = req.url,
        substring = "ajax";
    var isAjaxRequest = false;

    if (string.indexOf(substring) !== -1) {
        isAjaxRequest = true;
    }


    if (req.isAuthenticated()) {
        // load factories if user logged in
        var factoryQuery = "SELECT tbfactory.*,factory_datas.* FROM tbfactory INNER JOIN factory_datas on(tbfactory.fact_id = factory_datas.factory_id) WHERE fact_id IN (SELECT account_factories.factory_id FROM account_factories WHERE account_factories.accounts_id = '" + req.user.id + "')";

        global.sequelize.query(factoryQuery, {type: sequelize.QueryTypes.SELECT}).then(function (factoriesData) {
            app.locals.factories = factoriesData;
            setTimeout(function(){req.next()}, reqNextSleep);
        });
    }else{
        setTimeout(function(){req.next()}, reqNextSleep);
    }
});

fs
    .readdirSync(__dirname)
    .filter(function (file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function (file) {
        var currentLocation = path.join(__dirname, file);

        var isDirectory = fs.lstatSync(currentLocation).isDirectory();
        if(!isDirectory) {
            require(currentLocation);
        }else{
            fs
                .readdirSync(currentLocation)
                .filter(function (file) {
                    return (file.indexOf(".") !== 0) && (file !== "index.js");
                })
                .forEach(function (file) {
                    var currentFile = path.join(currentLocation, file);
                    require(currentFile);
                });
        }
    });

module.exports = routes;