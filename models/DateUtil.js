/**
 * New node file
 */
exports.getCurrentTime = function(){
	var date = new Date();

	var time = {
		date : date,
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