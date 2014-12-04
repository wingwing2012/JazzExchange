/*******************************************************************************
 * Licensed Materials - Property of IBM (c) Copyright IBM Corporation 2014. All
 * Rights Reserved.
 * 
 * Note to U.S. Government Users Restricted Rights: Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
/*
 * Get the current Time object which contain the following content: { date :
 * Date, timestamp : Number, // Timstamp value year : Number, month : String,
 * day : String, minute : String, seconds : String }
 */
exports.getCurrentTime = function() {
	var date = new Date();

	var time = {
		date : date,
		time : date.getTime(),
		year : date.getFullYear(),
		month : date.getFullYear() + '-' + (date.getMonth() + 1),
		day : date.getFullYear() + '-' + (date.getMonth() + 1) + '-'
				+ date.getDate(),
		minute : date.getFullYear()
				+ '-'
				+ (date.getMonth() + 1)
				+ '-'
				+ date.getDate()
				+ " "
				+ date.getHours()
				+ ":"
				+ (date.getMinutes() < 10 ? '0' + date.getMinutes() : date
						.getMinutes()),
		seconds : date.getFullYear()
				+ '-'
				+ (date.getMonth() + 1)
				+ '-'
				+ date.getDate()
				+ " "
				+ date.getHours()
				+ ":"
				+ (date.getMinutes() < 10 ? '0' + date.getMinutes() : date
						.getMinutes())
				+ ":"
				+ (date.getSeconds() < 10 ? '0' + date.getSeconds() : date
						.getSeconds())
	};
	return time;
};