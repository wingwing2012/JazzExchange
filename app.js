/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2014. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
/**
 * The node application execute js to start the Jazz Exchange application based
 * on Express 4.x
 * 
 * Created by Mix_iz team
 */
var express = require('express');
var path = require('path');

var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser');
var serverStatic = require('serve-static');
var MongoStore = require('connect-mongo')(session);

var app = express();

var settings = require('./settings');
var Tag = require('./models/tag');
var dbUtil = require('./models/utils/dbUtil.js');
var jazzUtil = require('./models/utils/jazzUtil.js');

var flash = require('connect-flash');
var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');

// Set the environment for this application.
app.set('port', port);
app.set('host', host);
app.set('views', __dirname + '/views');
// Use ejs as the HTML template render engine.
app.set('view engine', 'html');

// Use flash to store the session's logging message
app.use(flash());

// app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));

app.use(session({
	secret : settings.cookieSecret,
	key : settings.db,
	cookie : {
		maxAge : 1000 * 60 * 60 * 24 * 30
	}, // 30 days
	store : new MongoStore({
		db : settings.db,
		host : settings.host,
		port : settings.port,
		username : settings.user,
		password : settings.pwd
	})
}));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended : true
}));
app.use(cookieParser());
app.use(multer());
app.use(serverStatic(path.join(__dirname, 'public')));

// Use for development only
if ('development' === app.get('env')) {
	app.use(errorHandler());
}

// Multiple routes
app.use("/", require('./routes/indexRouter'));
app.use("/user", require('./routes/userRouter'));
app.use("/question", require('./routes/questionRouter'));

app.listen(app.get('port'), app.get('host'), function() {
	console.log('Express server listening on port ' + app.get('port'));
	var db = dbUtil.mongoose.connection;
	db.on('open', function() {
		Tag.addTags(function(err, project) {
			if (err) {
				console.log(err);
			}
		});
	});
	console.log('Express server listening on port ' + app.get('port'));
});
