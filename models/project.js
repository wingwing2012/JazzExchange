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
var dateUtil = require("./DateUtil");

function Project(projects) {
	this.projects = projects;
}

module.exports = Project;

Project.prototype.save = function(wholeDB, callback) {
	if (!this.projects) {
		return callback(null);
	}
	if (null == wholeDB) {
		return callback(null);
	}
	var insertProjects = this.projects;
	var time = dateUtil.getCurrentTime();

	// insert the node value to the mongo
	wholeDB.collection('project', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		var open = 0;
		var total = insertProjects.length;
		insertProjects.forEach(function(tempP, index) {
			var project = {
				name : tempP.name,
				url : tempP.url,
				time : time
			};
			// check the project exists or not
			collection.findOne({
				name : project.name
			}, function(err, doc) {
				if (err) {
					// mongodb.close();
					return callback(err);
				}

				if (typeof doc != 'undefined') {
					open++;
					if (null == doc) {
						collection.insert(project, {
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
						logger.log(logger.INFO, 'Insert the project \''
								+ project.name + '\'');
					} else {
						collection.update({
							'name' : project.name
						}, {
							$set : project
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

Project.getAll = function(wholeDB, callback) {
	wholeDB.collection('project', function(err, collection) {
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
