/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2014. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

/**
 * The node application execute js to start the jazzQ application.
 *
 * Created by Mixiz team
 */
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var Project = require('./models/project');
var Tag = require('./models/tag');
var mongodb = require('./models/db');
var jazzUtil = require('./models/jazzUtil.js');

var flash = require('connect-flash');
var sock = require('./models/socket');
var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');
var app = express();
var wholeDB = null;
// Set the environment for this application.
app.set('port', port);
app.set('host', host);
app.set('views', __dirname + '/views');
// Use ejs as the HTML template render engine.
app.set('view engine', 'ejs');

// Use flash to store the session's logging message
app.use(flash());

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({
	uploadDir : './uploads'
}));
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
	secret : settings.cookieSecret,
	key : settings.db,
	cookie : {
		maxAge : 1000 * 60 * 60 * 24 * 30
	}, //30 days
	store : new MongoStore({
		db : settings.db,
		host : settings.host,
		port : settings.port,
		username : settings.user,
		password : settings.pwd
	})
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// Use for development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

var server = http.createServer(app);
var io = require('socket.io').listen(server);
//socket é€šä¿¡
sock(io);
//æ‰§è¡Œsocket.jsé‡Œé�¢çš„å†…å®¹


server.listen(app.get('port'), app.get('host'), function() {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			mongodb.close();
			routes(wholeDB, app);
			return callback(err);
		}
		wholeDB = db;
		jazzUtil.logon(settings.jazzURL, settings.jazzUser, settings.jazzPwd, function(e) {
			if (null == e) {
				console.log("retrieve the projects!");
				//Which means logon successfully
				jazzUtil.getJazzProjects(function(projects) {
					if (null != projects && projects.length > 0) {
						var newProject = new Project(projects);
								newProject.save(wholeDB, function(err, project) {
							if (err) {
								console.log(err);
							}
						});
					}
				});
			}
		});
		var newTags = new Tag();
		newTags.save(wholeDB, function(err, project) {
			if (err) {
				console.log(err);
			}
		});
		routes(wholeDB, app);
	});
	console.log('Express server listening on port ' + app.get('port'));
});



