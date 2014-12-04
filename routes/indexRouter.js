/*******************************************************************************
 * Licensed Materials - Property of IBM (c) Copyright IBM Corporation 2014. All
 * Rights Reserved.
 * 
 * Note to U.S. Government Users Restricted Rights: Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
var crypto = require('crypto'); // password crypto
var User = require('../models/user.js');
var Question = require('../models/question.js');
var dateUtil = require("../models/utils/DateUtil");
var loginUtil = require("../models/utils/loginUtil");
var settings = require('../settings');
var gclient = require('../models/gclient.js');
var fs = require('fs');
var gm = require('gm');
var imageMagick = gm.subClass({
	imageMagick : true
});

var images = require("node-images");
var restConf = new gclient.config();
var express = require('express');
var indexRouter = express.Router();

restConf.conf = gclient.conf;
indexRouter.get('/', function(req, res) {
	// If the user has already logined, directly redirect to the index page.
	if (!req.session.user) {
		res.render('index', {
			title : "Jazz Exchange",
			name : "Made by the Mix_iz",
			user : req.session.user,
			error : req.flash('error').toString(),
			success : req.flash('success').toString()
		});
	} else {
		res.redirect('/show');
	}
});

// Logout
indexRouter.get('/loginout', function(req, res) {
	req.session.user = null;
	req.flash('success', 'Login successfully!');
	res.redirect('/');
});

// Login
indexRouter.post('/login', function(req, res) {
	// post
	var md5 = crypto.createHash('md5'), password = md5
			.update(req.body.password).digest('hex');
	var newUser = new User({
		name : req.body.name,
		password : password
	});
	// find the user
	User.get(newUser.name, function(err, user) {
		if (user) {
			// If find the user and compare the password with one in the DB
			if (user.password !== password) {
				req.flash('error', 'Password not correct.');
				res.redirect('/');
			} else {
				/** ****Gamification Code Here******* */
				var usrManager = new gclient.UserManager(restConf);
				// Check if the login uid already defined in the game plan,
				// if not register that uid in gameplan.
				usrManager.byName(user.name, function() {
				}, function(err) {
					usrManager.create(JSON.stringify({
						'uid' : user.name
					}));
				});
				var evtMgr = new gclient.EventManager(restConf);
				// call eventMgr.fireEvent(eventName,event
				// source,uid,callback)
				evtMgr
						.fireEvent('loginEvent', settings.gamiPlanName,
								user.name);
				req.session.user = user;
				res.redirect('/show');
			}
		} else {
			req.flash('error', 'User do not exit.');
			res.redirect('/');
		}
	});
});

// Post to register a user
indexRouter.get('/reg', loginUtil.checkNotLogin);
indexRouter.post('/reg', function(req, res) {
	var name = req.body.name;
	var password = req.body.password;
	var password_re = req.body.repassword;

	if (password_re !== password) {
		// If the password is not the same, return the messsage
		req.flash('error',
				'Not the same for the passowrd from twice inputting!');
		return res.redirect('/');
	}
	// Add the encrypto to the password
	var md5 = crypto.createHash('md5');
	password = md5.update(req.body.password).digest('hex');
	var newUser = new User({
		name : req.body.name,
		password : password
	});

	User.get(newUser.name, function(err, user) {
		if (user) {
			err = 'The user existed!';
		}
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}

		newUser.save(function(err, user) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			req.session.user = user;
			req.flash('success', 'Register successfully!');
			res.redirect('/show');
		});
	});
});
// http://localhost:3000/show
indexRouter.get('/show', loginUtil.checkLogin);
indexRouter.get('/show', function(req, res) {
	Question.getAll(null, function(data) {
		res.render('show', {
			title : "Jazz Exchange",
			name : "Made by Mix_iz team",
			lists : data,
			user : req.session.user
		});
	});
});

indexRouter.get('/proxy/*', function(req, res) {
	gclient.proxy(restConf);
});

// http://localhost:3000/error 404
indexRouter.get('*', function(req, res) {
	res.render('404', {
		title : "Jazz Exchange",
		name : "Made by Mix_iz team",
		user : req.session.user,
		error : req.flash('error').toString()
	});
});
module.exports = indexRouter;