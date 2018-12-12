/**
 * Created by ling xue on 15-10-10.
 */
var rq = require('../db/QueueCon.js') ;
var sysMsg = require('../util/SystemMsg.js');
var sysError = require('../util/SystemError.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('Message.js');


function sendMsg(req,res,next){

    rq.sendChannelMsg("hello world" , 'andriod' ,function(error,result){
        if (error) {
            logger.error(' sendMsg ' + error.message);
            throw sysError.InternalError(error.message,sysMsg.SYS_INTERNAL_ERROR_MSG);
        }else{
            logger.info(' sendMsg ' + ' success ');
            res.send(200, {success:true});
            return next();
        }
    })

}

module.exports = {
    sendMsg : sendMsg
}