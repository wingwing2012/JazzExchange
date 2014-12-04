/*******************************************************************************
 * Licensed Materials - Property of IBM (c) Copyright IBM Corporation 2014. All
 * Rights Reserved.
 * 
 * Note to U.S. Government Users Restricted Rights: Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
/**
 * New node file
 */
var settings = require('../settings');
var restClient = require('gamiRESTClient');
var restConf = restClient.config({
	gamiHost : settings.gamiHost,
	tenantId : settings.gamiTenantId,
	planName : settings.gamiPlanName,
	key : settings.gamiPlanKey,
	getLoginUid : function(req) {
		return req.session == null ? null : req.session.user;
	}
});

module.exports = restClient;
