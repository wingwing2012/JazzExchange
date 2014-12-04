/*******************************************************************************
 * Licensed Materials - Property of IBM (c) Copyright IBM Corporation 2014. All
 * Rights Reserved.
 * 
 * Note to U.S. Government Users Restricted Rights: Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
var settings = require('../../settings');
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var options = {
	server : {
		'socketOptions' : {
			keepAlive : 1
		}
	},
	replset : {
		'socketOptions' : {
			keepAlive : 1
		}
	}
};
mongoose.connect(settings.url, options);

var db = mongoose.connection;
db.on('open', function callback(){
	console.log("The mongodb has been connected!");
});
//Initialize the autoIncrement plugin
autoIncrement.initialize(mongoose);
exports.mongoose = mongoose;
exports.autoIncrement = autoIncrement;