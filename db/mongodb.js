var MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;
var serverLogger = require('../util/ServerLogger.js');
var sysConfig = require('../../.././SystemConfig.js');
var logger = serverLogger.createLogger('resourceDB.js');


//var mongoclient = new MongoClient(new Server("localhost", 27017), {native_parser: true});
var db= null;
MongoClient.connect(sysConfig.mongoConfig.connect,function(err, dbInstance) {
    if(err){
        logger.error(' connect Mongodb failed ' + err.message);

    }else{
        db= dbInstance;
    }

});

var getDB=function (callback){
    // Open the connection to the server
    if (db==null){
        logger.info(' getDb ' + 'attempt to create mongodb connection ')

        MongoClient.connect(sysConfig.mongoConfig.connect,function(err, dbInstance) {
            if(err){
                logger.error(' connect Mongodb failed ' + err.message);
                return callback(err,null);
            }else{
                return  callback(null,dbInstance);
            }

        });
    }else {
        callback(null, db);
    }

};



exports.getDb = getDB;

module.exports = {
    getDb: getDB
};

