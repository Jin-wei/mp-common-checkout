/**
 * log the order or order item change history
 */

var commonUtil = require('mp-common-util');
var historyDAO = require('../dao/HistoryDAO.js');
var serverLogger = require('../util/ServerLogger.js');
var resUtil = commonUtil.responseUtil;
var logger = serverLogger.createLogger('History.js');
var listOfValue = require('../util/ListOfValue.js');

function queryChangeHisotry(req,res,next){
    var params = req.params;
    var tenant=params.tenant;

    if (tenant==null) {
        //to do add new error type
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    historyDAO.queryChangeHistory(params ,function(error,rows){
        if(error){
            logger.error(' query ' + error.message);
            resUtil.resInternalError(error,res,next);
        }
        resUtil.resetQueryRes(res,rows);
        return next();
    });
}

function createOrderHistory(tenant,authUser,orderId,msg,callback){
    historyDAO.createChangeHistory(
        {tenant:tenant,
         itemId:orderId,
         createdBy:authUser.userId,
         createdUser:authUser.userName,
         itemType:listOfValue.HISTORY_ITEM_TYPE_ORDER,
         changeMsg:msg},function(err,result){
        if (err){
            logger.error("create order history failed: "+err.message);
            callback(err);
        }else{
            callback(null,result);
        }
    })
}

module.exports = {
    queryChangeHisotry:queryChangeHisotry,
    createOrderHistory:createOrderHistory
}