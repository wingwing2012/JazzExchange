/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2014. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

/**
 * Created by Mixiz
 */
var settings = require('../settings');
var logger = require('./logger');
var DEFUALT_TAGS = ["IBM", "Rational", "Gamification", "Proin", "Rational Team Concert", "jQuery", "uDeploy",
                    "DevOps", "Web 2.0", "Bluemix", "PAAS", "Green Hat", "Cloud", "dojo", "jazz"];


function Tag(tags) {
	this.tags = tags;
}


module.exports = Tag;

Tag.prototype.save = function(wholeDB, callback) {
	
	if (null == wholeDB) {
		return callback(null);
	}
	
	var insertTags = null;
	if (this.tags) {
		insertTags = this.tags;
	} else {
		insertTags = DEFUALT_TAGS;
	}
	var date = new Date();

	var time = {
		date : date,
		year : date.getFullYear(),
		month : date.getFullYear() + '-' + (date.getMonth() + 1),
		day : date.getFullYear() + '-' + (date.getMonth() + 1) + '-'
				+ date.getDate(),
		minute : date.getFullYear()
				+ '-'
				+ (date.getMonth() + 1)
				+ '-'
				+ date.getDate()
				+ " "
				+ date.getHours()
				+ ":"
				+ (date.getMinutes() < 10 ? '0' + date.getMinutes() : date
						.getMinutes()),
		second : date.getFullYear()
				+ '-'
				+ (date.getMonth() + 1)
				+ '-'
				+ date.getDate()
				+ " "
				+ date.getHours()
				+ ":"
				+ (date.getMinutes() < 10 ? '0' + date.getMinutes() : date
						.getMinutes())
				+ ":"
				+ (date.getSeconds() < 10 ? '0' + date.getSeconds() : date
						.getSeconds())

	};

	// insert the node value to the mongo
	wholeDB.collection('tag', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		var open = 0;
		var total = insertTags.length;
		insertTags.forEach(function(tempTag, index) {
			var tag = {
				name : tempTag,				
				time : time
			};
			// check the project exists or not
			collection.findOne({
				name : tag.name
			}, function(err, doc) {
				if (err) {
					// mongodb.close();
					return callback(err);
				}

				if (typeof doc != 'undefined') {
					open++;
					if (null == doc) {
						collection.insert(tag, {
							safe : true
						}, function(err) {
							if (err) {
								// mongodb.close();
								return callback(err);
							}
							if (open === total) {
								callback(null);
							}
						});
						logger.log(logger.INFO, 'Insert the tag \''
								+ tag.name + '\'');
					} else {
						collection.update({
							'name' : tag.name
						}, {
							$set : tag
						}, function(err, result) {
							if (err) {
//								mongodb.close();
								callback(err);
							}

							if (open === total) {
								callback(null);
							}
							// 成功！返回插入的用户信息
						});
					}
				}
			});
		});
	});
};

Tag.getAll = function(wholeDB, callback) {
	wholeDB.collection('tag', function(err, collection) {
		if (err) {
//			mongodb.close();
			return callback(err);
		}
		collection.find().sort({
			time : -1
		}).toArray(function(err, docs) {
//			mongodb.close();
			if (err) {
				return callback(err);
			}
			callback(null, docs);
		});
	});

};

