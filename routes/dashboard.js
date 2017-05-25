var models  = require('../models');
require('../controllers/Factory');

app.get('/', isLoggedInRedirect, function(req, res) {
	res.redirect('/dashboard');
});

app.get('/dashboard', isLoggedInRedirect, function(req, res) {
	res.render('pages/dashboard/main.ejs',{
		account: req.user,
		factories: req.app.locals.factories
	});
});
