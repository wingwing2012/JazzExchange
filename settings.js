var mongo = new Object();
var url = null;
var gamiObj = new Object();
if (process.env.VCAP_SERVICES) {
	var env = JSON.parse(process.env.VCAP_SERVICES);
	url = env['mongolab'][0].credentials.uri;
	gamiObj.tenantId = env['Gamification'][0].credentials.tenantId;
	gamiObj.gamiHost = env['Gamification'][0].credentials.gamiHost;
} else {
  	url = "mongodb://localhost:27017/jazzExchange";
  	gamiObj.tenantId= "6f457683-1881-496a-a6fb-e99110b62da2";
  	gamiObj.gamiHost = "gs.ng.bluemix.net";
}
gamiObj.key = "af540a49-56e5-4086-bda1-ad6011192c82";
gamiObj.planName = "jazzExGamePlan";
mongo.url = url;
var index = url.indexOf("@");
var account = null;
var server = null;
if (index >= 0 && url.length >= index + 1) {
	server = url.substring(index + 1, url.length);
	account = url.substring(url.indexOf("://") + 3, index);	
} else {
	server = url.substring(url.indexOf("://") + 3, url.length);	
}
if (null != server) {
	var indexServer = server.lastIndexOf("/");
	var hostSection = server.substring(0, indexServer)
	mongo.db = server.substring(indexServer + 1, server.length);
	var hostArray = hostSection.split(":");
	if (hostArray.length == 2) {
		mongo.host = hostArray[0];
		mongo.port = hostArray[1];
	} else {
		mongo.host = "localhost";
		mongo.port = "27017";
	}
}
if (null == account) {
	mongo.username = "";
	mongo.password = "";
} else {
	var accArray = account.split(":");
	if (accArray.length == 2) {
		mongo.username = accArray[0];
		mongo.password = accArray[1];
	} else if (accArray.length == 1){
		mongo.username = accArray[0];
		mongo.password = "";
	}
}

if (process.env.VCAP_SERVICES) {
	var env = JSON.parse(process.env.VCAP_SERVICES);
	url = env['mongolab'][0].credentials.uri;
} else {
  	url = "mongodb://localhost:27017/jazzExchange";
}
module.exports = { 
  cookieSecret: 'jazzExchange', 
  db: mongo.db, 
  user: mongo.username,
  pwd:mongo.password,
  host: mongo.host,
  port: mongo.port,
  url:mongo.url,
//  jazzURL: "https://ri03.cn.ibm.com:9443/jazz",
  jazzURL: "https://jazzdev.torolab.ibm.com:9443/jazz",
  jazzUser:"liyaqiang",
  jazzPwd:"ling0907",
  gamiTenantId: gamiObj.tenantId,
  gamiHost: gamiObj.gamiHost,
  gamiPlanKey: gamiObj.key,
  gamiPlanName: gamiObj.planName
}; 
