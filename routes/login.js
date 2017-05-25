app.get('/signup', function(req, res) {
	res.render('pages/signup/main.ejs', { message: req.flash('signupMessage') });
});
app.post('/signup', passport.authenticate('local-signup', {
	successRedirect : '/',
	failureRedirect : '/signup',
	failureFlash : true
}));
app.get('/login', function(req, res) {
	res.render('pages/login/main.ejs', { message: req.flash('loginMessage') });
});
app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/dashboard',
		failureRedirect : '/login',
		failureFlash : true
	}),
	function(req, res) {
		if (req.body.remember) {
		  req.session.cookie.maxAge = 1000 * 60 * 3;
		} else {
		  req.session.cookie.expires = false;
		}

		res.redirect('/');
});

app.get('/logout', function(req, res) {
	// destroy the session of current account
    req.session.destroy(function (err) {
        req.logout();
        req.session = null;
        req.user = null;
        // then redirect to front page (login)
        res.redirect('/');
    });
});