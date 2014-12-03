var settings = require('../settings');

function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
	this.address = user.address;
	this.company = user.company;
	this.school = user.school;
	this.info = user.info;
	this.imgUrl = user.imgUrl;
	this.tags = [];
};
module.exports = User;
User.prototype.save = function(wholeDB, callback) {
	// callback 是执行玩保存后的回调函数
	var user = {
		name : this.name,
		password : this.password,
		// 下面内容在注册时不用填，在个人首页可以修改，所以先设置默认值和默认头像
		address : "暂无",
		company : "暂无",
		school : "暂无",
		info : "暂无",
		imgUrl : "./public/images/11.jpg",
		tags : this.tags // Each tags contains, the tag name and the score of the tag.
	};
	// Connect to the user collection
	wholeDB.collection('user', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		collection.insert(user, {
			safe : true
		}, function(err, result) {
			// mongodb.close();
			callback(err, user);
		});
	});
};
// 读取用户信息
User.get = function(name, wholeDB, callback) {
	// open the user collection
	wholeDB.collection('user', function(err, collection) {
		if (err) {
//			mongodb.close();
			return callback(err);
		}
		// Find the collection with the name
		collection.findOne({
			name : name
		}, function(err, doc) {
//			mongodb.close();
			if (doc) {
				var user = new User(doc);
				callback(err, user);
			} else {
				callback(err, null);
			}
		});
	});
};

User.prototype.updateEdit = function(wholeDB, callback) {
	var user = {
		name : this.name,
		address : this.address,
		company : this.company,
		school : this.school,
		info : this.info,
		imgUrl : this.imgUrl
	};
	wholeDB.collection('user', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		var upUser = {};
		// 下面判断信息是否需要更新
		if (user.address != "") {
			upUser.address = user.address;
		}
		if (user.company != "") {
			upUser.company = user.company;
		}
		if (user.school != "") {
			upUser.school = user.school;
		}
		if (user.info != "") {
			upUser.info = user.info;
		}
		if (!!user.imgUrl) {
			upUser.imgUrl = user.imgUrl;
		}
		collection.update({
			'name' : user.name
		}, {
			$set : upUser
		}, function(err, result) {
			// mongodb.close();
			callback(err, user);
			// 成功！返回插入的用户信息
		});
	});
};

User.updateTagScore = function(userName, tags, wholeDB, callback) {	
	wholeDB.collection('user', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		tags.forEach(function(tag, index){
			collection.update({
				'name' : userName, 'tags.name' : tag.name
			}, {
				$inc : {
					"tags.$.score" : 1
				}
			}, function(err, result) {
				// mongodb.close();
				callback(err, user);
				// 成功！返回插入的用户信息
			});
		});		
		
	});
};

User.superAdmin = function(name, psd, wholeDB, callback) {
	// 读取 users 集合
	wholeDB.collection('user', function(err, collection) {
		if (err) {
			// mongodb.close();
			return callback(err);
		}
		// 判断是否为超级管理员
		if (name == "admin") {
			// 查找用户名 name 值为 name文档
			collection.find({
				name : 'admin'
			}).toArray(function(err, items) {
				if (err)
					throw err;
				// mongodb.close();
				if (psd == items[0].password) {
					return callback({
						admin : 1
					});
				} else {
					return callback({
						admin : 0
					});
				}
			});
		} else {
			collection.find({
				name : name
			}).toArray(function(err, items) {
				if (err)
					throw err;
				// mongodb.close();
				if (psd == items[0].password) {
					if (items.admin && items.admin == 2) {
						return callback({
							admin : 2
						});
					}
				} else {
					return callback({
						admin : 0
					});
				}
			});
		}
	});
};

User.superAdmin = function(name, psd, wholeDB, callback) {
	wholeDB.collection('user', function(err, collection) {
		if (err) {
//			mongodb.close();
			return callback(err);
		}
		// 判断是否是超级管理
		if (name == "admin") {
			collection.find({
				name : 'admin'
			}).toArray(function(err, items) {
				if (err)
					throw err;
//				mongodb.close();
				if (psd == items[0].password) {
					return callback({
						admin : "1"
					});
				} else {
					return callback({
						admin : "3"
					});
				}
			});
		} else {
//			mongodb.close();
			return callback({
				admin : "3"
			});
		}
	});
};

User.getQuestionAdmin = function(wholeDB, callback) {
	wholeDB.collection('question', function(err, collection) {
		if (err) {
//			mongodb.close();
			return callback(err);
		}
		// 这里我们仅仅查找10个出来，作为示范，
		collection.find().limit(10).sort({
			time : -1
		}).toArray(function(err, items) {
			if (err)
				throw err;
//			mongodb.close();
			return callback(items);
		});
	});
};

User.adminChange = function(change, id, childId, delAndRe, wholeDB, callback) {
	wholeDB.collection('question', function(err, collection) {
		if (err) {
//			mongodb.close();
			return callback(err);
		}

		if (delAndRe == "del") {// del表示屏蔽用户
			if (childId == "") {// 表示这个问题没有被回答
				collection.update({
					'_id' : Number(id)
				}, {
					$set : {
						hide : false
					}
				}, function(err, info) {
					// 给这个问题加了一个hide字段false表示隐藏，true表示显示
					if (err)
						throw err;
//					mongodb.close();
					callback(info);
					// 成功！返回插入的用户信息
				});
			} else {
				// 表示这个问题被回答了，我这里的逻辑其实有的问题，因为在mongodb存储时没有规划好，所以导致的，我这里当我需要屏蔽一个回答时，把整个提问都屏蔽了，这里大家可以在后面改改，这样就只用屏蔽回复，不影响提问
				collection.update({
					"answer.answer" : childId
				}, {
					$set : {
						hide : false
					}
				}, function(err, info) {
					if (err)
						throw err;
//					mongodb.close();
					callback(info);
					// 成功！返回插入的用户信息
				});
			}
		} else {
			if (childId == "") {
				collection.update({
					'_id' : Number(id)
				}, {
					$set : {
						hide : true
					}
				}, function(err, info) {
					if (err)
						throw err;
//					mongodb.close();
					callback(info);
					// 成功！返回插入的用户信息
				});
			} else {
				collection.update({
					"answer.answer" : childId
				}, {
					$set : {
						hide : true
					}
				}, function(err, info) {
					if (err)
						throw err;
//					mongodb.close();
					callback(info);
					// 成功！返回插入的用户信息
				});
			}
			;
		}
		;
	});
};