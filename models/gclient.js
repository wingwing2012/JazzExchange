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
