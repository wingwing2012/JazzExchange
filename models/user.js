/*******************************************************************************
 * Licensed Materials - Property of IBM (c) Copyright IBM Corporation 2014. All
 * Rights Reserved.
 * 
 * Note to U.S. Government Users Restricted Rights: Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
var settings = require('../settings');
var dbUtil = require('./utils/dbUtil.js');
var mongoose = dbUtil.mongoose;

var userSchema = new mongoose.Schema({
	name : {
		type : String,
		'default' : 'DefaultUser'
	},
	password : {
		type : String
	},
	tags : {
		type : Array,
		'default' : []
	},
	email : {
		type : String
	},
	address : {
		type : String,
		'default' : 'unavailable'
	},
	company : {
		type : String,
		'default' : 'unavailable'
	},
	info : {
		type : String,
		'default' : 'unavailable'
	},
	imgUrl : {
		type : String
	}
});
userSchema.static('updateEdit', function(userObj, callback) {
	if (!userObj) {
		return;
	}
	var userQuery = {
		name : userObj.name
	};
	User.findOneAndUpdate(userQuery, userObj, function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		callback(err, collection);
	});
});

// Get the user infor from the MongoDB
userSchema.static('get', function(name, callback) {
	// open the user collection
	var userQuery = {
		'name' : name
	};
	User.findOne(userQuery, function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		callback(err, collection);
	});
});

userSchema.static('updateTagScore', function(userName, tags, callback) {
	var userQuery = {
		'name' : userName
	};
	User.findOne(userQuery, function(err, user) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		tags.forEach(function(tag, index) {
			User.update({
				'name' : user.name,
				'tags.name' : tag.name
			}, {
				$inc : {
					"tags.$.score" : 1
				}
			}, function(err, numberAffected) {
				if (err) {
					return callback(err);
				}
				callback(err, user);
			});
		});
	});
});

var User = mongoose.model('user', userSchema, 'user');

module.exports = User;

