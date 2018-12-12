/**
 * Created by ling xue on 15-10-8.
 */

var amqp = require('amqplib/callback_api');
var sysConfig = require('../../.././SystemConfig.js');
var sysMsg = require('../../util/SystemMsg.js');
var sysError = require('../../util/SystemError.js');
var listOfValue = require('../../util/ListOfValue.js');
var messageType = require('../../util/MessageType.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('QueueCon.js');

var rabbitConnect = null;
getConnection();

function sendMsg(msg,queue,callback){
    amqp.connect(sysConfig.rabbitUrl,function(error,con){
        if(error){
            logger.error("Connect rabbit error :"+error.message);
            if (con) con.close(function() { process.exit(1); });
            callback(error,null);
        }else{
            con.createChannel(function(error,ch){
                if(error){
                    logger.error("create rabbit channel error :"+error.message);
                    if (con) con.close(function() { process.exit(1); });
                    callback(error,null);
                }else{
                    /*ch.assertQueue(queue, {durable: false}, function(err, ok) {
                        if (err !== null) {
                            logger.error("create rabbit queue error :"+err.message);
                            if (con) con.close(function() { process.exit(1); });
                            callback(err,null);
                        }else{
                            ch.sendToQueue(queue, new Buffer(msg));
                            logger.info(" send to rabbit success " + msg);
                            ch.close(function() { con.close(); });
                            callback(null,ok)
                        }
                    });*/
                    ch.assertExchange(messageType.RABBIT_EXCHANGE, 'topic', {durable: true}, function(err, ok) {
                        if (err !== null) {
                            logger.error("create rabbit queue error :"+err.message);
                            if (con) con.close(function() { process.exit(1); });
                            callback(err,null);
                        }else{
                            ch.publish(messageType.RABBIT_EXCHANGE, messageType.RABBIT_TOPIC_NOTIFICATION, new Buffer(msg));
                            ch.close(function() { con.close(); });
                            callback(null,ok)
                        }

                    });
                }
            })
        }
    })
}

function getConnection(){
    if(rabbitConnect){
        return rabbitConnect;
    }else{
        amqp.connect(sysConfig.rabbitUrl,function(error,con){
            if(error){
                logger.error("Connect rabbit error :"+error.message);
                if (con) con.close(function() { process.exit(1); });
                return null;
            }else{
                rabbitConnect = con;
                return rabbitConnect;
            }
        })
    }
}

function sendChannelMsg(msg , queue ,callback){
    if(rabbitConnect == null){
        logger.error("can not connect rabbit :" + sysMsg.SYS_MESSAGE_QUEUE_ERROR_MSG)
        return callback(sysError.InternalError,null);
    }
    rabbitConnect.createChannel(function(error,ch){
        if(error){
            logger.error("create rabbit channel error :"+error.message);
            callback(error,null);
        }else{
            ch.assertQueue(queue, {durable: true}, function(err, result) {
                if (err !== null) {
                    logger.error("create rabbit queue error :"+err.message);

                }else{
                    ch.sendToQueue(queue, new Buffer(JSON.stringify(msg)) ,{persistent: true,deliveryMode: true});
                    logger.info(" send to rabbit success " + msg);
                }
                if(ch){ch.close();}
                callback(err,result);
            });
        }
    })
}

function sendQueueMsg(msg,callback){
    var queue = messageType.RABBIT_QUEUE_NORMAL ;
    if(rabbitConnect == null){
        logger.error("can not connect rabbit :" + sysMsg.SYS_MESSAGE_QUEUE_ERROR_MSG)
        return callback(sysError.InternalError,null);
    }
    rabbitConnect.createChannel(function(error,ch){
        if(error){
            logger.error("create rabbit channel error :"+error.message);
            callback(error,null);
        }else{
            ch.assertQueue(queue, {durable: true}, function(err, result) {
                if (err !== null) {
                    logger.error("create rabbit queue error :"+err.message);

                }else{
                    ch.sendToQueue(queue, new Buffer(JSON.stringify(msg)) ,{persistent: true,deliveryMode: true});
                    logger.info(" send to rabbit success " + msg);
                }
                if(ch){ch.close();}
                callback(err,result);
            });

        }
    })
}
function sendTopicMsg (msg,callback){
    if(rabbitConnect == null){
        logger.error("can not connect rabbit :" + sysMsg.SYS_MESSAGE_QUEUE_ERROR_MSG)
        return callback(sysError.InternalError,null);
    }
    rabbitConnect.createChannel(function(error,ch){
        if(error){
            logger.error("create rabbit channel error :"+error.message);
            callback(error,null);
        }else{

            ch.assertExchange(messageType.RABBIT_EXCHANGE, 'topic', {durable: true,deliveryMode: true}, function(err, result) {
                if (err !== null) {
                    logger.error("create rabbit exchange error :"+err.message);

                }else{
                    ch.publish(messageType.RABBIT_EXCHANGE, messageType.RABBIT_TOPIC_ORDER, new Buffer(JSON.stringify(msg)),{durable: true,deliveryMode: true});
                    logger.info(" send to rabbit exchange success " + msg);
                }
                if(ch){ch.close();}
                callback(err,result);

            });
        }
    })
}
module.exports = {
    sendMsg : sendMsg ,
    sendChannelMsg : sendChannelMsg ,
    sendQueueMsg  : sendQueueMsg ,
    sendTopicMsg : sendTopicMsg
}