/*******************************************************************************
 * Licensed Materials - Property of IBM (c) Copyright IBM Corporation 2014. All
 * Rights Reserved.
 * 
 * Note to U.S. Government Users Restricted Rights: Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
/**
 * The logger for the application to log something.
 */

var logger = {};
logger.debugLevel = 'warn';
logger.ERROR = 'error';
logger.DEBUG = 'warn';
logger.INFO = 'info';
logger.log = function(level, message) {
	var levels = [ 'error', 'warn', 'info' ];
	if (levels.indexOf(level) >= levels.indexOf(logger.debugLevel)) {
		if (typeof message !== 'string') {
			message = JSON.stringify(message);
		}
		console.log(level + ': ' + message);
	}
};

module.exports = logger;