/**
 * The logger for the application to log something.
 */

var logger = new Object();
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