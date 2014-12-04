/*******************************************************************************
 * Licensed Materials - Property of IBM (c) Copyright IBM Corporation 2014. All
 * Rights Reserved.
 * 
 * Note to U.S. Government Users Restricted Rights: Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
var express = require('express');
var questionRouter = express.Router();
var Question = require('../models/question.js');
var settings = require('../settings');
var Tag = require('../models/tag.js');
var dbUtil = require('../models/utils/dbUtil.js');
var loginUtil = require("../models/utils/loginUtil");

questionRouter.get('/getAll', loginUtil.checkLogin);
questionRouter.get('/getAll', function(req, res) {
	Question.getQuestionPage(req.query.page, function(data) {
		res.render('show', {
			title : "JazzExchange",
			name : "Made by Mix_iz team"
		});
		res.send(data);
	});
});

// question vote + 1
questionRouter.post('/addVote', function(req, res) {
	var questionId = req.body.questionId;
	var userId = req.session.user.name;
	Question.addVote(questionId, userId, function(info) {
		res.redirect('/question/' + questionId);
	});
});

questionRouter.post('/removeVote', function(req, res) {
	var questionId = req.body.questionId;
	var userId = req.session.user.name;
	Question.removeVote(questionId, userId, function(info) {
		res.redirect('/question/' + questionId);
	});
});
// http://localhost:3000/question/1 具体问题展示页
questionRouter.get('/:id', loginUtil.checkLogin);
questionRouter.get('/:id', function(req, res) {
	Question.getById(req.params.id, function(err, items) {
		// View the question and add the xp +1 to the user's value
		if (items && items.length > 0) {
			var questionId = items[0]._id;
			var userId = req.session.user.name;
			Question.addView(questionId, userId, function(info) {
				res.render('question', {
					items : items[0],
					user : req.session.user,
					id : req.params.id
				});
			});
		}
	});
});
questionRouter.get('/askQuestion', loginUtil.checkLogin);
questionRouter.get('/askQuestion', function(req, res) {
	Tag.getAll(function(err, docs) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		res.render('askQuestion', {
			user : req.session.user,
			tags : docs,
			error : req.flash('error').toString()
		});
	});
});

questionRouter.post('/askQuestion', function(req, res) {
	var tagArray = [];
	req.body.tag.forEach(function(tempTag, index) {
		var tagObj = {};
		tagObj.name = tempTag;
		tagObj.score = 1;
		tagArray.push(tagObj);
	});
	var question = new Question(req.body.title, req.body.project,
			req.session.user.name, req.body.askText, tagArray);
	question.save(function(err, doc) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		req.flash('success', 'Ask question successfully!');
		res.redirect('/show');
	});
});

// Answer the question
questionRouter.post('/answer', function(req, res) {
	var answer = {};
	answer.answer = req.body.answer;
	answer.id = Number(req.body.answerNum);
	answer.user = req.session.user;
	answer.vote = [];
	answer.time = Date.now;
	var questionId = req.body.questionId;
	Question.addAnswer(questionId, answer, function(info) {
		req.flash('success', 'And the answer to the question successfully!');
		res.redirect('/question/' + questionId);
	});
});
// get all tags
questionRouter.get('/getTags', function(req, res) {
	Tag.getAll(function(err, data) {
		res.send(data);
	});
});

// answer vote + 1
questionRouter.post('/answer/addVote', function(req, res) {
	var answerId = req.body.answerId;
	var questionId = req.body.questionId;
	var userId = req.session.user.name;
	Question.addVoteAnswer(questionId, answerId, userId, function(info) {
		res.redirect('/question/' + questionId);
	});
});

// answer vote - 1
questionRouter.post('/answer/removeVote', function(req, res) {
	var answerId = req.body.answerId;
	var questionId = req.body.questionId;
	var userId = req.session.user.name;
	Question.removeVoteAnswer(questionId, answerId, userId, function(info) {
		res.redirect('/question/' + questionId);
	});
});

module.exports = questionRouter;