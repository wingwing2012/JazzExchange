var crypto = require('crypto'); // 密码加密模块
var User = require('../models/user.js');
var Question = require('../models/question.js');
var Project = require('../models/project.js');
var Tag = require('../models/tag.js');
var https = require('https');
var path = require('path');
var xmlreader = require('xmlreader');
var jazzUtil = require('../models/jazzUtil.js');
var dateUtil = require("../models/DateUtil");
var settings = require('../settings');
var gclient = require('../models/gclient.js');
var restConf = new gclient.config;
restConf.conf = gclient.conf;
// 引入用户登录函数
// 移动文件需要使用fs模块
var fs = require('fs');

// 国外插件
var gm = require('gm');
var imageMagick = gm.subClass({
	imageMagick : true
});
// 引用国内插件
var images = require("node-images");

module.exports = function(wholeDB, app) {
	app.get('/', function(req, res) {
		// If the user has already logined, directly redirect to the index page.
		if (!req.session.user) {
			res.render('index', {
				title : "JazzQ",
				name : "由Mixiz团队打造的JazzQ平台",
				user : req.session.user,
				error : req.flash('error').toString(),
				success : req.flash('success').toString()
			});
		} else {
			res.redirect('/show');
		}
	});
	// Logout
	app.get('/loginout', function(req, res) {
		req.session.user = null;
		req.flash('success', 'Login successfully!');
		res.redirect('/');
	});
	// Login
	app.post('/login', function(req, res) {
		// post过来的密码加密
		var md5 = crypto.createHash('md5'), password = md5.update(
				req.body.password).digest('hex');
		var newUser = new User({
			name : req.body.name,
			password : password
		});
		// 查找用户
		User.get(newUser.name, wholeDB, function(err, user) {
			if (user) {
				// 如果存在，就返回用户的所有信息，取出password来和post过来的password比较
				if (user.password != password) {
					req.flash('error', '密码不正确');
					res.redirect('/');
				} else {
					/** ****Gamification Code Here******* */
					var usrManager = new gclient.UserManager(restConf);
					// Check if the login uid already defined in the game plan,
					// if not register that uid in gameplan.
					usrManager.byName(user.name, function() {
					}, function(err) {
						usrManager.create(JSON.stringify({
							'uid' : user.name
						}));
					});
					var evtMgr = new gclient.EventManager(restConf);
					// call eventMgr.fireEvent(eventName,event
					// source,uid,callback)
					evtMgr.fireEvent('loginEvent', settings.gamiPlanName,
							user.name);
					req.session.user = user;
					res.redirect('/show');
				}
			} else {
				req.flash('error', '用户不存在');
				res.redirect('/');
			}
		});
	});
	// 发送注册信息接受地址http://localhost:3000/reg
	app.get('/reg', checkNotLogin);
	app
			.post(
					'/reg',
					function(req, res) {
						// 在post请求后的反应
						// post信息中发送过来的name,password和repassword,用req.body获取
						var name = req.body.name, password = req.body.password, password_re = req.body['repassword'];
						// 后端判断两次注册的密码是否相等
						if (password_re != password) {
							// 如果密码不相等，将信息记录到页面通知flash,然后跳转到http://localhost:3000/
							req.flash('error', '两次输入的密码不一致!');
							return res.redirect('/');
						}
						// 对密码进行加密操作
						var md5 = crypto.createHash('md5'), password = md5
								.update(req.body.password).digest('hex');
						var newUser = new User({
							name : req.body.name,
							password : password
						});
						// 使用user.js中的user.get() 函数来读取用户信息
						User.get(newUser.name, wholeDB, function(err, user) {
							// 如果有返回值，表示存在用户
							if (user) {
								err = '用户已存在!';
							}
							if (err) {
								// 如果报错，记录错误信息和页面跳转
								req.flash('error', err);
								return res.redirect('/');
							}
							// 使用user.js的user.save() 保存信息函数
							newUser.save(wholeDB, function(err, user) {
								if (err) {
									req.flash('error', err);
									return res.redirect('/');
								}
								// 成功后，将用户信息记录在页面间的会话req.session中，并且跳转到一个新页面，就是内容集中展示页面
								req.session.user = user;
								req.flash('success', '注册成功!');
								res.redirect('/show');
							});
						});
					});
	// http://localhost:3000/show 网站登陆后内容展示页
	app.get('/show', checkLogin);
	app.get('/show', function(req, res) {
		Question.getAll(null, wholeDB, function(data) {
			res.render('show', {
				title : "JazzQ",
				name : "由Mixiz团队打造的JazzQ平台",
				lists : data,
				user : req.session.user
			});
		});
	});

	// ajax异步的get请求获取地址http://localhost:3000/getQuestion
	app.get('/getQuestion', checkLogin);
	app.get('/getQuestion', function(req, res) {
		Question.getQuestionPage(req.query.page, wholeDB, function(data) {
			// 对返回的数据做些处理
			for (var i = 0, l = data.length; i < l; i++) {
				// data[i].imgUrl = data[i].imgUrl.replace("./public/", "");
			}
			res.render('show', {
				title : "JazzQ",
				name : "由Mixiz团队打造的JazzQ平台"
			});
			res.send(data);
		});
	});

	// ajax异步的get请求得到project的选择框
	// app.get('/getProject', checkLogin);
	app.get('/getProject', function(req, res) {
		Project.getAll(wholeDB, function(err, data) {
			res.send(data);
		});
	});
	app.get('/project', checkLogin);
	app.get('/project', function(req, res) {
		Project.getAll(wholeDB, function(err, data) {
			if (err) {
				req.flash('error', '无法取得项目列表');
				res.redirect('/');
			}

			if (null != data) {
				if (data.length < 1) {
					res.render('project', {
						lists : [],
						user : req.session.user
					});
				} else {
					res.render('project', {
						lists : data,
						user : req.session.user
					});
				}
			} else {
				req.flash('error', '无法取得项目列表');
				res.redirect('/');
			}
		});

	});
	// http://localhost:3000/people/tang tang这个用户的展示页面
	app.get('/people/:user', function(req, res) {
		User.get(req.params.user, wholeDB, function(err, user) {
			user.imgUrl = user.imgUrl.replace("./public", "");
			// 先查询到用户信息，然后查询用户的提问
			Question.getByUser(user.name, wholeDB, function(question) {
				res.render('people', {
					address : user.address,
					company : user.company,
					school : user.school,
					info : user.info,
					name : req.params.user,
					user : req.session.user,
					question : question,
					imgUrl : user.imgUrl
				});
			});
		});
	});
	// 发生编辑和修改个人信息的请求地址http://localhost:3000/people
	app.post('/people', function(req, res) {
		// 头像地址
		var tmp_path, target_path;
		if (req.files.thumbnail.size > 0) {// 表示有图片文件上传
			tmp_path = req.files.thumbnail.path;
			// 指定文件上传后的目录 - 示例为"images"目录。
			// 重命名图片名字
			var picType = req.files.thumbnail.name.split(".");
			picType = picType[1];
			target_path = './public/images/user/pic_' + req.session.user.name
					+ "." + picType;
			// 移动文件
			fs.rename(tmp_path, target_path, function(err) {
				if (err)
					throw err;
				// 程序执行到这里，user文件下面就会有一个你上传的图片
				imageMagick(target_path).resize(150, 150, '!')// 加('!')强行把图片缩放成对应尺寸150*150！
				.autoOrient().write(target_path, function(err) {
					if (err) {
						console.log(err);
					}
				});
			});
		}
		var newUser = new User({
			name : req.session.user.name,
			address : req.body.address,
			company : req.body.company,
			school : req.body.school,
			info : req.body.info,
			imgUrl : target_path,
		});
		// 更新
		newUser.updateEdit(wholeDB, function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			req.session.user = newUser;
			// 用户信息存入session
			// req.flash('success','注册成功!');
			res.redirect('/people/' + newUser.name);
		});
	});

	app.post('/people/tags', function(req, res) {
		// 头像地址
		var user = req.body.user;
		var tags = req.body.tags;
		// 更新
		User.updateTagScore(user, tags, wholeDB, function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
		});
	});
	// question vote + 1
	app.post('/question/addVote', function(req, res) {
		var questionId = req.body.questionId;
		var userId = req.session.user.name;
		Question.addVote(questionId, userId, wholeDB, function(info) {
			res.redirect('/question/' + questionId);
		});
	});

	app.post('/question/removeVote', function(req, res) {
		var questionId = req.body.questionId;
		var userId = req.session.user.name;
		Question.removeVote(questionId, userId, wholeDB, function(info) {
			res.redirect('/question/' + questionId);
		});
	});
	// http://localhost:3000/question/1 具体问题展示页
	app.get('/question/:id', checkLogin);
	app.get('/question/:id', function(req, res) {
		Question.getById(req.params.id, wholeDB, function(err, items) {
			// View the question and add the xp +1 to the user's value
			if (items && items.length > 0) {
				var questionId = items[0]._id;
				var userId = req.session.user.name;
				Question.view(questionId, userId, wholeDB, function(info) {
					res.render('question', {
						items : items[0],
						user : req.session.user,
						id : req.params.id
					});
				});
			}
		});
	});
	app.get('/askQuestion', checkLogin);
	app.get('/askQuestion', function(req, res) {
		Tag.getAll(wholeDB, function(err, docs) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('askQuestion', {
				user : req.session.user,
				tags : docs,
				error : req.flash('error').toString()
			});
		});

	});
	app.post('/askQuestion', function(req, res) {
		var question = new Question(req.body.title, req.body.project,
				req.session.user.name, req.body.askText, req.body.tag);
		question.save(wholeDB, function(err, doc) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '提交问题成功!');
			res.redirect('/show');
		});
	});

	// ajax异步回答问题地址http://localhost:3000/answer
	app.post('/answer', function(req, res) {
		var answer = {};
		answer.answer = req.body.answer;
		answer.id = Number(req.body.answerNum);
		answer.user = req.session.user;
		answer.vote = [];
		answer.time = dateUtil.getCurrentTime();
		var questionId = req.body.questionId;
		Question.answer(questionId, answer, wholeDB, function(info) {
			req.flash('success', '提交问题成功!');
			res.redirect('/question/' + questionId);
		});
	});
	// get all tags
	app.get('/getTags', function(req, res) {
		Tag.getAll(wholeDB, function(err, data) {
			res.send(data);
		});
	});

	// answer vote + 1
	app.post('/answer/addVote', function(req, res) {
		var answerId = req.body.answerId;
		var questionId = req.body.questionId;
		var userId = req.session.user.name;
		Question.addVoteAnswer(questionId, answerId, userId, wholeDB,
				function(info) {
					res.redirect('/question/' + questionId);
				});
	});
	
	// answer vote - 1
	app.post('/answer/removeVote', function(req, res) {
		var answerId = req.body.answerId;
		var questionId = req.body.questionId;
		var userId = req.session.user.name;
		Question.removeVoteAnswer(questionId, answerId, userId, wholeDB,
				function(info) {
					res.redirect('/question/' + questionId);
				});
	});
	// 后台管理
	app.get('/admin', function(req, res) {
		res.render('adminlogin', {
			user : req.session.user,
			error : req.flash('error').toString()
		});
	});
	// 管理员登陆发送信息地址
	app.post('/adminLogin', function(req, res) {
		var adminName = req.body.name;
		var md5 = crypto.createHash('md5'), adminPwd = md5.update(
				req.body.password).digest('hex');
		User.superAdmin(adminName, adminPwd, wholeDB, function(info) {
			if (info.admin == "1") {// 超级管理员
				// 获取管理内容
				User.getQuestionAdmin(function(data) {
					res.render('admincon', {
						lists : data,
						user : req.session.user,
					});
				});
			} else if (info.admin == "2") {// 普通管理员
				User.getQuestionAdmin(function(data) {
					res.render('admincon', {
						lists : data,
						user : req.session.user,
					});
				});
			} else {
				res.redirect('/show');
			}
		});
	});
	// 信息管理页面地址
	app.get('/admincon', function(req, res) {
		res.redirect('/admin');
	});
	// 发生修改信息地址
	app
			.post(
					'/adminchange',
					function(req, res) {
						// 获取表单提交的信息
						var change = req.body.change, id = req.body.id, childId = req.body.childId, delAndRe = req.body.delAndRe;
						// 在数据库中处理
						User.adminChange(change, id, childId, delAndRe,
								wholeDB, function(data) {
									if (data == 1) {
										User.getQuestionAdmin(function(data) {
											res.render('admincon', {
												lists : data,
												user : req.session.user,
											});
										});
									}
								});
					});

	function checkLogin(req, res, next) {
		if (!req.session.user) {
			req.flash('error', '未登录');
			res.redirect('/');
		}
		next();
	}

	function checkNotLogin(req, res, next) {
		if (req.session.user) {
			req.flash('error', '已登录');
			res.redirect('back');
		}
		next();
	}
	app.get('/proxy/*', function(req, res) {
		gClient.proxy(restConf)
	});
	// http://localhost:3000/error 404和错误页面展示地址
	app.get('*', function(req, res) {
		res.render('404', {
			title : "JazzQ",
			name : "由Mixiz团队打造的JazzQ平台",
			user : req.session.user,
			error : req.flash('error').toString()
		});
	});
};
