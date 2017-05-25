var LocalStrategy = require('passport-local').Strategy;
var models = require('../models');
var bcrypt = require('bcrypt-nodejs');
var Mailer = require('../controllers/Mailer');
var moment = require('moment');
var SQLQueries = require('../config/sql_queries');
var passportMemcached = require('passport-memcached');


module.exports = function (passport, mysqlPool, memcached) {

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        models.sequelize.query(SQLQueries["get-account"].replace('<!account_id!>', id), {type: sequelize.QueryTypes.SELECT}).then(function (accountsData) {
            accountsData = accountsData[0];
            done(null, accountsData);
        });
    });

    passport.use(
        'local-login',
        new LocalStrategy({
                usernameField: 'email',
                passwordField: 'password',
                passReqToCallback: true
            },
            function (req, email, password, done) {
                models.sequelize.query(SQLQueries["get-account-login"].replace('<!account_email!>', email), {type: sequelize.QueryTypes.SELECT}).then(function (account) {
                    if (account) {
                        account = account[0];
                        var password_hash = account.password;
                        if (!bcrypt.compareSync(password, password_hash)) {
                            // send a notify e-mail if somebody try to log in with bad password
                            var ip = (req.headers && req.headers['x-forwarded-for'])
                                || req.ip
                                || req._remoteAddress
                                || (req.connection && req.connection.remoteAddress);

                            var testMail = {
                                'subject': 'Incorrect login attempts!',
                                'email': email,
                                'client_ip': ip,
                                'when': moment().format(),
                                'account_name': account.name
                            };
                            Mailer.sendMail(testMail.email, testMail.subject, "invalid-login-notification", testMail);

                            return done(null, false, req.flash('loginMessage', toLang('LOGIN:WRONG_PASSWORD')));
                        }

                        return done(null, account);

                    } else {
                        return done(null, false, req.flash('loginMessage', toLang('LOGIN:NO_USER_FOUND')));
                    }
                });
            })
    );
};
