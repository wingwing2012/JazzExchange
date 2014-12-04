/*******************************************************************************
 * Licensed Materials - Property of IBM (c) Copyright IBM Corporation 2014. All
 * Rights Reserved.
 * 
 * Note to U.S. Government Users Restricted Rights: Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
var express = require('express');
var userRouter = express.Router();
var User = require('../models/user.js');
var Question = require('../models/question.js');
var fs = require('fs');
var gm = require('gm');
var imageMagick = gm.subClass({
	imageMagick : true
});

// Get the user profile page
userRouter.get('/user/:userName', function(req, res) {
	User.get(req.params.user, function(err, user) {
		user.imgUrl = user.imgUrl.replace("./public", "");

		Question.getByUser(user.name, function(question) {
			res.render('profile', {
				address : user.address,
				company : user.company,
				school : user.school,
				info : user.info,
				name : req.params.user,
				user : req.session.user,
				question : question,
				imgUrl : user.imgUrl
			});
		});
	});
});

// Edit the user's profile properties
userRouter.post('/user/profile', function(req, res) {
	// Set the picture for the user's avatar
	var tmp_path, target_path;
	if (req.files.thumbnail.size > 0) {// 表示有图片文件上传
		tmp_path = req.files.thumbnail.path;

		var picType = req.files.thumbnail.name.split(".");
		picType = picType[1];
		target_path = './public/images/user/pic_' + req.session.user.name + "." + picType;
		// Move the picture to the correct location
		fs.rename(tmp_path, target_path, function(err) {
			if (err) {
				throw err;
			}
			// Add '!' to made the icon to 150 x 150 forcedly
			imageMagick(target_path).resize(150, 150, '!').autoOrient().write(
					target_path, function(err) {
						if (err) {
							console.log(err);
						}
					});
		});
	}
	
	var newUser = {
		name : req.session.user.name,
		address : req.body.address,
		company : req.body.company,
		school : req.body.school,
		info : req.body.info,
		imgUrl : target_path,
	};
	
	// update the user
	User.updateEdit(newUser, function(err, user) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		req.session.user = user;

		// store the message to the session flash.
		req.flash('success', 'Update the user\\\'s properties successfull!');
		res.redirect('/user/' + user.name);
	});
});

userRouter.post('/user/tags', function(req, res) {
	var user = req.body.user;
	var tags = req.body.tags;

	User.updateTagScore(user, tags, function(err) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
	});
});

module.exports = userRouter;