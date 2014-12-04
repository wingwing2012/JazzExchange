/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2014. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/
/**
 * Tag model object for the Mongoose.
 * 
 */
var settings = require('../settings');
var logger = require('./logger');
var dbUtil = require('./utils/dbUtil.js');
var logger = require('./logger');
var mongoose = dbUtil.mongoose;

var DEFUALT_TAGS = [ "IBM", "Rational", "Gamification", "Proin",
		"Rational Team Concert", "jQuery", "uDeploy", "DevOps", "Web 2.0",
		"Bluemix", "PAAS", "Green Hat", "Cloud", "dojo", "jazz" ];

var tagSchema = new mongoose.Schema({
	name : {
		type : String
	},
	time : {
		type : Date,
		'default' : Date.now
	}
});

tagSchema.static('addTags', function(tags, callback) {
	var tempTags = null;
	var callback = null;
	if (!tags || tags instanceof Function) {
		tempTags = DEFUALT_TAGS;
		if (null !== tags &&  tags instanceof Function) {
			callback = tags;
		}		
	} else if (tags instanceof Array) {
		tempTags = tags;
	}
	
	tempTags.forEach(function(tempTag, index) {
		Tag.findOne({
			name : tempTag
		}, function(err, tag) {
			if (err) {
				return callback(err);
			}
			if (tag === null) {
				var newTag = new Tag({
					name : tempTag
				});
				newTag.save(function(err) {
					if (err) {
						return callback(null);
					}
					logger.log(logger.INFO, 'Insert the tag \'' + newTag.name
							+ '\'');
					callback(newTag);
				});
			}
		});
	});
});

tagSchema.static('getAll', function(callback) {
	Tag.find().sort('name -time').exec(function(err, tags) {
		if (err) {
			return callback(err);
		}
		callback(null, tags);
	});
});

var Tag = mongoose.model('tag', tagSchema, 'tag');

module.exports = Tag;
