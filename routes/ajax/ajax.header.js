var models  = require('../../models/index');

app.get('/ajax/setFactory/:factory_id(\\d+)', isLoggedInRedirect, function(req, res) {
    req.session.selected_factory = req.params.factory_id;
    req.session.selected_cell = null;
    req.session.selected_device = null;
	res.send("ok");
});


app.get('/ajax/setCell/:cell_id(\\d+)', isLoggedInRedirect, function(req, res) {
	req.session.selected_cell = req.params.cell_id;
    req.session.selected_device = null;
	res.send("ok");
});

app.get('/ajax/setDevice/:device_id(\\d+)', isLoggedInRedirect, function(req, res) {
	global.session.selected_device = req.params.device_id;
	res.send("ok");
});