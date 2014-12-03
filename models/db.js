var settings = require('../settings');
var mongo = require('mongodb');
var Client = mongo.MongoClient;
var Server = mongo.Server;

module.exports = new Client(new Server(settings.host, settings.port)); 