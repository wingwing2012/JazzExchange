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
exports.checkLogin = function checkLogin(req, res, next) {
	if (!req.session.user) {
		req.flash('error', 'Do not login.');
		res.redirect('/');
	}
	next();
};

exports.checkNotLogin = function checkNotLogin(req, res, next) {
	if (req.session.user) {
		req.flash('error', 'Has logged in.');
		res.redirect('back');
	}
	next();
};