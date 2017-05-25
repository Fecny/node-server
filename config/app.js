module.exports = function(app, cookieParser, express, bodyParser, session, passport, flash, morgan, sessionMiddleware) {
    // app.use(timeout('1s'));
    app.use(cookieParser());
    // app.use(haltOnTimedout)
    // app.use(morgan('dev'));
    app.use(express.static('static'));
    app.use('/static', express.static('static'));
    // app.use('/node_modules', express.static('node_modules'));


    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());

    app.set('view engine', 'ejs');

    app.use(sessionMiddleware);

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    // app.use(haltOnTimedout)

    function haltOnTimedout (req, res, next) {
        if (!req.timedout) next()
    }
};