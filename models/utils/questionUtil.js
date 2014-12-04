/*******************************************************************************
 * Licensed Materials - Property of IBM (c) Copyright IBM Corporation 2014. All
 * Rights Reserved.
 * 
 * Note to U.S. Government Users Restricted Rights: Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/

/*
 * The login Check utility to check the user login or not first.
 * 
 */

exports.calculateScore = function calculateScore(question) {
	if (null === question) {
		return;
	}
	var score = 0;
	var view = question.view.length;
	var vote = question.vote.length;
	var answerSize = question.answer.length;
	var currentTime = dateUtil.getCurrentTime();
	var qAge = currentTime.timestamp - question.time.timestamp;
	qAge = (qAge/1000/3600).toFixed(2);
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
	var wholeAge =  Math.pow((qAge / 2 + qUpdated / 2 + 1), 1.5);
	wholeAge = wholeAge.toFixed(4);
	score = (viewValue * 4 + vote * answerSize / 5 + answerScore ) / wholeAge;
	score = score.toFixed(6);
	return score;
};