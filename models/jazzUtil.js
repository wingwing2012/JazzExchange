
/**
 * JazzUtil to get information from JTS
 */
var URL=require('url');
var http = require('http');
var https = require('https');
var path = require('path');
var xmlreader = require('xmlreader');
var logger = require('./logger');

var authKey = '';
var UID = '';
var PID = '';
var hostName = '';
var portName = '';
var suffixLogon = '/authenticated/identity';
var suffixGetPrjs = '/oslc/workitems/catalog';
var urlContext = '';

var convertStr2Byte = function(str){
	var bytes = [];
	for(var i=0; i<str.length; i++){
		bytes.push(str.charCodeAt(i));
	}
	return bytes;
};
//Baisc logon
var doBasicLogon = function(res, logonCallback){
	var UIDPID = UID + ":" + PID;
	var byteKey = convertStr2Byte(UIDPID);
	authKey = "Basic "+ new Buffer(byteKey).toString('base64');
	var headerInfo = {  
	    host: hostName,  
        method: 'GET',   
        path: urlContext+suffixLogon,
		scheme:'https',
		port:portName,
		rejectUnauthorized: false,
	    requestCert: true,
	    agent: false,
        headers: {  
			'Authorization': authKey
        }  
    }; 
	var req = https.request(headerInfo,function (res) {
		if (res.statusCode == 200) {

			var isLogon = isAuthSuccess(res, UID, logonCallback)
			
		}else{
			return false;
		}
	});  
	req.on('error', function(e) {
		logonCallback(e);
		logger.log(logger.ERROR, 'Failed to do the basic logon ' + e.message);
	}); 
    req.end();  
}

// Exported to logon the JTS
exports.logon = function(jtsURL, user, password, logonCallback){
	// res.send("Logon");
	UID = user;
	PID = password;
	var parsedURL = URL.parse(jtsURL);
	hostName = parsedURL.hostname;
	urlContext = parsedURL.path;
	portName = parsedURL.port;
    var headerInfo = {  
	    host: hostName,  
        method: 'GET',   
        path: urlContext+suffixLogon,
		scheme:'https', 
		port:portName,
		rejectUnauthorized: false,
	    requestCert: true,
	    agent: false
	    // headers: {
	    	// 'accept':'text/json',
	    	// 'content-type':'application/x-www-form-urlencoded; charset=utf-8',
	    	// 'X-com-ibm-team-configuration-versions':'LATEST',
	    	// 'X-Jazz-CSRF-Prevent':''
	    // }
    };  
  
    var req = https.request(headerInfo,function (res) {
		if (res.statusCode == 401) {
			var authMeth = res.headers['www-authenticate'];
			if(-1 != authMeth.indexOf('Basic')){
				doBasicLogon(res, logonCallback);
			}
		} else {
			logonCallback();
		}
	});  
	req.on('error', function(e) {
		if(null !== logonCallback){
			logonCallback(e)
		}
		console.log('Problems happened when logon: ' + e.message);
	}); 

    req.end();  
};

//Exported to get all jazz project names
exports.getJazzProjects = function(getDataCallback){
	
	var headerInfo = {  
		    host: hostName,  
	        method: 'GET',   
	        path: urlContext+suffixGetPrjs,
			scheme:'https',
			port:portName,
			rejectUnauthorized: false,
		    requestCert: true,
		    agent: false,
	        headers: {  
				'accpet': 'text/json',
				'Authorization': authKey
	        }  
	}; 
	var req = https.request(headerInfo,function (res) {
		var body='';
		if (res.statusCode == 200) {
			res.setEncoding('utf8');
			res.on('data',function (chunk) {
				body += chunk;
			});
			
			res.on('end',function () {
				parseJazzProjects(body, getDataCallback);
			});
	
		}else{
				return false;
		}
	});  
	req.on('error', function(e) {
		console.log('Failed to get data ' + e.message);
	}); 
	req.end();  	
};



var isAuthSuccess = function(serverFeedback, userID, logonCallback){
	var body = '';
	if (serverFeedback.statusCode != 200) {
		return false;
	} 
	
	serverFeedback.on('data',function (chunk) {
		body += chunk;
	});
	
	serverFeedback.on('end',function (chunk) {
		if(-1 != body.indexOf(userID)){
			logonCallback();
		}else{
			errorCallback("No user is found");
		}
	});

};

// parse the jazz project names
var parseJazzProjects = function(content, getDataCallback){
	var projects= [];
	xmlreader.read(content, function(errors, res){
		if(null !== errors ){
			console.log(errors);
		}
		//Get all entires
		var responseEntries = res['oslc_disc:ServiceProviderCatalog']['oslc_disc:entry'];
		var length = responseEntries.count();
		for(var i=0; i<length; i++){
			//reverse each node
			var thisEntry = responseEntries.at(i);
			//Get the project title from each node
			var projectName = thisEntry['oslc_disc:ServiceProvider']['dc:title'].text();
			// var index = projectName.indexOf('|');
			// if (index > 1) {
				// projectName = projectName.substr(index + 2);
			// }
			//
			// var index = projectName.indexOf("LJosef");
			// var index1 = projectName.indexOf("liyaqiang");
			// if (index < 0 && index1 < 0) {
				// continue;				
			// }
			var index = projectName.indexOf("LJosef");
			if (i > 10 && index < 0) {
				continue;				 				
			}
			var projectURL = thisEntry['oslc_disc:ServiceProvider']['oslc_disc:details'].attributes()['rdf:resource'];
						
			var project = {
				name : projectName,
				url : projectURL
			};
			if (index > -1) {
				projects.unshift(project);
			} else {
				projects.push(project);
			}
			// console.log(projectName);
		}
		getDataCallback(projects);
	});
	
};


