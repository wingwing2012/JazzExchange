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
var dateUtil = require("./utils/dateUtil");
var ANSWER_SCORE_LENGTH = 15;
var dbUtil = require('./utils/dbUtil.js');
var mongoose = dbUtil.mongoose;
var autoIncrement = dbUtil.autoIncrement;

var questionSchema = new mongoose.Schema({
	name : {
		type : String,
		'default' : 'DefaultUser'
	},
	user : {
		type : String
	},
	answer : [ {
		content : {
			type : String
		},
		vote : {
			type : Array,
			'default' : []
		},
		time : {
			type : Date,
			'default' : Date.now
		}
	} ],
	tags : [ {
		name : {
			type : String
		},
		score : {
			type : Number,
			'default' : 1
		}
	} ],
	content : {
		type : String
	},
	vote : {
		type : Array,
		'default' : []
	},
	view : {
		type : Array,
		'default' : []
	},
	score : {
		type : Number,
		'default' : 0
	},
	time : {
		type : Date,
		'default' : Date.now
	},
	update : {
		type : Date,
		'default' : Date.now
	},
	hide : {
		type : Boolean,
		'default' : false
	}
});

// Set the auto increment for _id and set it as the index of the question
// collection
questionSchema.plugin(autoIncrement.plugin, {
	model : 'question',
	field : '_id',
	startAt : 0,
	incrementBy : 1
});
questionSchema.plugin(autoIncrement.plugin, {
	model : 'question.answer',
	field : '_id',
	startAt : 0,
	incrementBy : 1
});
questionSchema.index({
	_id : 1
});

questionSchema.static('getAll', function(page, wholeDB, callback) {
	Question.find({
		hide : {
			$ne : false
		}
	}).sort('-score -time').exec(function(err, items) {
		if (err) {
			throw err;
		}
		return callback(items);
	});
});

// Get the questions which belong to the specified user.
questionSchema.static('getByUser', function(user, wholeDB, callback) {
	Question.find({
		user : user,
		hide : {
			$ne : false
		}
	}).sort('-time').toArray(function(err, items) {
		if (err) {
			throw err;
		}
		return callback(items);
	});
});

questionSchema.static('getByTags', function(tags, wholeDB, callback) {

	if (tags) {
		return callback(null);
	}

	Question.find({
		'tags.name' : {
			$in : tags
		},
		hide : {
			$ne : false
		}
	}).sort('-score -time').exec(function(err, questions) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		return callback(questions);
	});
});

questionSchema.static('getById', function(id, callback) {
	Question.findOne({
		_id : Number(id),
		hide : {
			$ne : false
		}
	}, function(err, question) {
		if (err || !question) {
			return callback(err);
		}
		return callback(err, question);
	});
});

questionSchema.static('getQuestionPage', function(page, callback) {
	// The page number
	var num = page * 10;
	Question.find({
		hide : {
			$ne : false
		}
	}).skip(num).limit(10).sort('-score -time').exec(function(err, questions) {
		if (err) {
			throw err;
		}
		callback(questions);
	});
});

questionSchema.static('addAnswer', function(questionId, answer, callback) {
	Question.findOneAndUpdate({
		_id : Number(questionId)
	}, {
		$push : {
			answer : answer
		},
		$set : {
			update : answer.time
		}
	}, function(err, question) {
		if (err) {
			throw err;
		}
		if (question) {
			question.updateScore(callback);
		}
	});

});

questionSchema.static('addView', function(questionId, userId, callback) {
	Question.findOneAndUpdate({
		_id : Number(questionId)
	}, {
		$addToSet : {
			"view" : [ userId ]
		}
	}, function(err, question) {
		if (err) {
			throw err;
		}
		if (question) {
			question.updateScore(callback);
		}
	});
});

questionSchema.static('addVote', function(questionId, userId, callback) {
	Question.findOneAndUpdate({
		_id : Number(questionId)
	}, {
		$addToSet : {
			"vote" : [ userId ]
		}
	}, function(err, question) {
		if (err) {
			throw err;
		}
		if (question) {
			question.updateScore(callback);
		}
	});
});

questionSchema.static('removeVote', function(questionId, userId, callback) {
	Question.findOneAndUpdate({
		_id : Number(questionId)
	}, {
		$pull : {
			"vote" : [ userId ]
		}
	}, function(err, question) {
		if (err) {
			throw err;
		}
		if (question) {
			question.updateScore(callback);
		}
	});
});

// Need to add tag
questionSchema.static('voteTag', function(questionId, tag, wholeDB, callback) {
	Question.findOneAndUpdate({
		_id : Number(questionId)
	}, {
		$inc : {
			"tag.$.score" : 1
		}
	}, function(err, question) {
		if (err) {
			throw err;
		}
		if (question) {
			question.updateScore(callback);
		}
	});
});

questionSchema.static('addVoteAnswer', function(questionId, answerId, userId,
		callback) {
	Question.findOneAndUpdate({
		_id : Number(questionId),
		"answer.id" : Number(answerId)
	}, {
		$addToSet : {
			"answer.$.vote" : [ userId ]
		}
	}, function(err, question) {
		if (err) {
			throw err;
		}
		if (question) {
			question.updateScore(callback);
		}
	});
});

questionSchema.static('removeVoteAnswer', function(questionId, answerId,
		userId, callback) {
	Question.findOneAndUpdate({
		_id : Number(questionId),
		"answer.id" : Number(answerId)
	}, {
		$pull : {
			"answer.$.vote" : [ userId ]
		}
	}, function(err, question) {
		if (err) {
			throw err;
		}
		if (question) {
			question.updateScore(callback);
		}
	});
});

questionSchema.method('updateScore', function(callback) {
	function calculateScore(question) {
		if (null === question) {
			return;
		}
		var score = 0;
		var view = question.view.length;
		var vote = question.vote.length;
		var answerSize = question.answer.length;
		var currentTime = dateUtil.getCurrentTime();
		var qAge = currentTime.timestamp - question.time.timestamp;
		qAge = (qAge / 1000 / 3600).toFixed(2);
		var qUpdated = currentTime.timestamp - question.update.timestamp;
		qUpdated = (qUpdated / 1000 / 3600).toFixed();
		var answerScore = 0;
		question.answer.forEach(function(tempA, index) {
			if (null === tempA) {
				return;
			}
			if (tempA.answer.length >= ANSWER_SCORE_LENGTH) {
				answerScore++;
			}
			answerScore += tempA.vote.length;
		});
		var viewValue = 0;
		if (view > 0) {
			if (view === 1) {
				viewValue = 0.01;
			} else {
				viewValue = Math.log(view).toFixed(4);
			}
		}
		var wholeAge = Math.pow((qAge / 2 + qUpdated / 2 + 1), 1.5);
		wholeAge = wholeAge.toFixed(4);
		score = (viewValue * 4 + vote * answerSize / 5 + answerScore) / wholeAge;
		score = score.toFixed(6);
		return score;
	}
	var score = calculateScore(this);
	this.findOneAndUpdate({
		_id : this._id
	}, {
		$set : {
			"score" : score
		}
	}, function(err, question) {
		if (err) {
			throw err;
		}
		if (question) {
			callback(question);
		}
	});
});

var Question = mongoose.model('question', questionSchema, 'question');

module.exports = Question;
