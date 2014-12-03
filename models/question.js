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
var mongodb = require('./db');
var settings = require('../settings');
var dateUtil = require("./DateUtil");
var ANSWER_SCORE_LENGTH = 15;

function Question(name, project, user, content, tag) {
	this.name = name;
	this.project = project;
	this.user = user;
	this.content = content;
	this.answer = [];
	this.tag = tag;
	this.view = 0;
	this.vote = 0;
}

module.exports = Question;

Question.prototype.save = function(wholeDB, callback) {
	var time = dateUtil.getCurrentTime();
	var tagArray = [];
	this.tag.forEach(function(tempTag, index){
		var tagObj = {};
		tagObj.name = tempTag;
		tagObj.score = 1;
		tagArray.push(tagObj);
	});
	
	var question = {
		name : this.name,
		project : this.project,
		user : this.user,
		content : this.content,
		answer : [],
		tag : tagArray,
		vote : [],
		view : [],
		score : 0,
		hide : true,
		time : time,
		update : time
	};

	// insert the node value to the
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		collection.find().sort({
			time : -1
		}).toArray(function(err, items) {// 按照添加时间查找，查找最近的一个
			if (items.length == 0) {// 如果没有，就从0 开始
				ids = 0;
			} else {
				ids = items[0]._id;
				// 如果有，就获取到最近一个的id值，然后+1
				ids++;
			}
			question._id = ids;
			// 这个_id是我们自己定义的
			collection.insert(question, {
				safe : true
			}, function(err, result) {
				// mongodb.close();
				wholeDB.collection('user', function(err, collection) {
					if (err) {
						// mongodb.close();
						return callback(err);
					}
					collection.update({ name : question.user.name}, {
						$addToSet : { "tags" : question.tag}
					}, function(err, items) {
						if (err) {
							// mongodb.close();
							return callback(err);
						}
						callback(err, question);
						// 成功！返回插入的用户信息
					});
				});				
			});
		});
	});
};

Question.getAll = function(page, wholeDB, callback) {
	var num = page * 5;
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		// 查找用户名 name 值为 name文档
		collection.find({
			hide : {
				$ne : false
			}
		}).skip(num).limit(5).sort({
			"score" : -1, "time" : -1 
		}).toArray(function(err, items) {
			if (err)
				throw err;
			return callback(items);			
		});
	});
};

Question.getByUser = function(user, wholeDB, callback) {
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}

		collection.find({
			user : user
		}).sort({
			time : -1
		}).toArray(function(err, items) {
			if (err)
				throw err;
			// mongodb.close();
			return callback(items);
		});
	});
};

Question.getByProject = function(project, wholeDB, callback) {
	wholeDB.collection('questions', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}

		// 查找用户名 name 值为 name文档 ,并且hide为true
		collection.find({
			project : project
		}).sort({
			time : -1
		}).toArray(function(err, items) {
			if (err)
				throw err;
			// mongodb.close();
			// 遍历数据
			return callback(items);
		});
	});
};

Question.getById = function(id, wholeDB, callback) {
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		collection.find({
			_id : Number(id)
		}).toArray(function(err, items) {
			if (err)
				throw err;
			// mongodb.close();
			return callback(err, items);
		});
	});
};

Question.getQuestionPage = function(page, wholeDB, callback) {
	// 打开数据库
	var num = page * 5;
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		// 查找用户名 name 值为 name文档
		collection.find({
			hide : {
				$ne : false
			}
		}).skip(num).limit(5).sort({
			'score' : -1, 'time' : -1
		}).toArray(function(err, items) {
			if (err)
				throw err;
			// 二次查询
			var open = 0;
			wholeDB.collection('user', function(err, collection) {
				for (var i = 0, l = items.length; i < l; i++) {
					collection.findOne({
						name : items[i].user
					}, function(err, doc) {
						items[open].imgUrl = doc.imgUrl;
						open++;
						if (open == l) {
							// mongodb.close();
							return callback(items);
						}
					});
				}
			});
		});
	});
};

Question.answer = function(questionId, answer, wholeDB, callback) {
	// 打开数据库
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}

		// 这里可以暂停一下进度，阅读下mongodb的一些操作方法，本文的最下面有一个还不错的pdf讲解mongodb的增删改查的
		collection.update({
			_id : Number(questionId)
		}, {
			$push : {
				answer : answer
			}
		}, function(err, items) {
			if (err)
				throw err;
			collection.update({
				_id : Number(questionId)
			}, {
				$set : {
					update : answer.time
				}
			}, function(err, items) {
				Question.updateScore(questionId, wholeDB, callback);
			});
		});
	});
};

Question.view = function(questionId, userId, wholeDB, callback) {
	// 打开数据库
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		// 这里可以暂停一下进度，阅读下mongodb的一些操作方法，本文的最下面有一个还不错的pdf讲解mongodb的增删改查的
		collection.update({
			_id : Number(questionId)
		}, {
			$addToSet : {
				"view" : [ userId ]
			}
		}, function(err, items) {
			if (err)
				throw err;
			Question.updateScore(questionId, wholeDB, callback);
		});
	});
};

Question.addVote = function(questionId, userId, wholeDB, callback) {
	// 打开数据库
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		// 这里可以暂停一下进度，阅读下mongodb的一些操作方法，本文的最下面有一个还不错的pdf讲解mongodb的增删改查的
		collection.update({
			_id : Number(questionId)
		}, {
			$addToSet : {
				"vote" : [ userId ]
			}
		}, function(err, items) {
			if (err)
				throw err;
			Question.updateScore(questionId, wholeDB, callback);
		});
	});
};

Question.removeVote = function(questionId, userId, wholeDB, callback) {
	// 打开数据库
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		// 这里可以暂停一下进度，阅读下mongodb的一些操作方法，本文的最下面有一个还不错的pdf讲解mongodb的增删改查的
		collection.update({
			_id : Number(questionId)
		}, {
			$pull : {
				"vote" : [ userId ]
			}
		}, function(err, items) {
			if (err)
				throw err;
			Question.updateScore(questionId, wholeDB, callback);
		});
	});
};
// Need to add tag
Question.voteTag = function(questionId, tag, wholeDB, callback) {
	// 打开数据库
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		// 这里可以暂停一下进度，阅读下mongodb的一些操作方法，本文的最下面有一个还不错的pdf讲解mongodb的增删改查的
		collection.update({
			_id : Number(questionId)
		}, {
			$inc : {
				"tag.$.score" : 1
			}
		}, function(err, items) {
			if (err)
				throw err;
			Question.updateScore(questionId, wholeDB, callback);
		});
	});
};

Question.addVoteAnswer = function(questionId, answerId, userId, wholeDB, callback) {
	// 打开数据库
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		collection.update({
			_id : Number(questionId),
			"answer.id" : Number(answerId)
		}, {
			$addToSet : {
				"answer.$.vote" : [userId]
			}
		}, function(err, items) {
			if (err)
				throw err;
			// mongodb.close();
			Question.updateScore(questionId, wholeDB, callback);			
		});
	});
};

Question.removeVoteAnswer = function(questionId, answerId, userId, wholeDB, callback) {
	// 打开数据库
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		collection.update({
			_id : Number(questionId),
			"answer.id" : Number(answerId)
		}, {
			$pull : {
				"answer.$.vote" : [userId]
			}
		}, function(err, items) {
			if (err)
				throw err;
			// mongodb.close();
			Question.updateScore(questionId, wholeDB, callback);			
		});
	});
};
Question.updateScore = function(questionId, wholeDB, callback) {
	// 打开数据库
	wholeDB.collection('question', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		// 这里可以暂停一下进度，阅读下mongodb的一些操作方法，本文的最下面有一个还不错的pdf讲解mongodb的增删改查的
		collection.find({
			_id : Number(questionId)
		}).toArray(function(err, items) {
			if (err)
				throw err;
			if (items.length > 0) {
				var score = calculateScore(items[0]);
				collection.update({
					_id : Number(questionId)
				}, {
					$set : {
						"score" : score
					}
				}, function(err, updatedItems) {
					if (err)
						throw err;
					// mongodb.close();
					return callback(updatedItems);
				});
			}			
		});
	});
};	


function calculateScore(question) {
	if (null == question) {
		return;
	}
	var score = 0;
	var view = question.view.length;
	var vote = question.vote.length;
	var answerSize = question.answer.length;
	var currentTime = dateUtil.getCurrentTime();
	var qAge = currentTime.date.getTime() - question.time.date.getTime();
	qAge = (qAge/1000/3600).toFixed(2);
	var qUpdated = currentTime.date.getTime() - question.update.date.getTime();
	qUpdated = (qUpdated / 1000 / 3600).toFixed();
	var answerScore = 0;
	question.answer.forEach(function(tempA, index) {
		if (null == tempA) {
			return;
		}
		if (tempA.answer.length >= ANSWER_SCORE_LENGTH) {
			answerScore++;
		}
		answerScore += tempA.vote.length;
	});
	var viewValue = 0;
	if (view > 0) {
		if (view == 1) {
			viewValue = 0.01;
		} else {
			viewValue = Math.log(view).toFixed(4);
		}
	}
	var wholeAge =  Math.pow((qAge / 2 + qUpdated / 2 + 1), 1.5);
	var wholeAge = wholeAge.toFixed(4);
	score = (viewValue * 4 + vote * answerSize / 5 + answerScore ) / wholeAge;
	score = score.toFixed(6);
	return score;
};