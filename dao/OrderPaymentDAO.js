/**
 * Created by ling xue on 2016/3/10.
 */
var db=require('../db/MysqlDb.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('OrderPaymentDAO.js');

function getPayment(params,callback){
    var query = " select id as paymentId, user_id as userId, biz_id as bizId, order_id orderId, " +
        "payment_info paymentInfo, payment_type paymentType, " +
        "payment_status paymentStatus, payment_actual paymentActual, parent_payment_id parentPaymentId, " +
        "created_on createdOn, updated_on updatedOn,created_by createdBy, updated_by updatedBy from order_payment where tenant=? ";
    var paramArray=[],i= 0,whereclause="";
    paramArray[i++]=params.tenant;
    if(params.orderId !=null){
        paramArray[i++]=Number(params.orderId);
        whereclause= whereclause + " and id = ? "
    }
    if(params.userId !=null){
        paramArray[i++]=Number(params.userId);
        whereclause =  whereclause + " and user_id = ? "
    }
    if(params.bizId !=null){
        paramArray[i++]=Number(params.bizId);
        whereclause =  whereclause + " and biz_id = ? "
    }
    if(params.paymentType !=null){
        paramArray[i++]=Number(params.paymentType);
        whereclause =  whereclause + " and payment_type = ? "
    }
    if(params.paymentStatus){
        paramArray[i++]=params.paymentStatus;
        whereclause =  whereclause + " and payment_status = ? "
    }
    if(params.startDate && params.endDate){
        paramArray[i++] = params.startDate;
        paramArray[i++] = params.endDate;
        whereclause = whereclause + " and created_on between ? and ? "
    }
    query = query +whereclause+" order by id desc "
    if(params.start!=null && params.size){
        query= query + " limit ? , ? "
        paramArray[i++] = Number(params.start);
        paramArray[i++] = Number(params.size);
    }
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' queryPayment ');
        return callback(error,rows);
    });
}

function addPayment(params,callback){
    var query  = "insert into order_payment(tenant,payment_nonce,order_id,user_id,biz_id," +
        "payment_info,payment_type,payment_status,payment_due,payment_actual,payment_refund," +
        "parent_payment_id,created_by,updated_by) " +
        "values(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ";
    var paramArray=[],i=0;
    paramArray[i++] = params.tenant;
    paramArray[i++] = params.paymentNonce;
    paramArray[i++] = params.orderId;
    paramArray[i++] = params.userId;
    paramArray[i++] = params.bizId;
    paramArray[i++] = params.paymentInfo;
    paramArray[i++] = params.paymentType;
    paramArray[i++] = params.paymentStatus;
    paramArray[i++] = params.paymentDue;
    paramArray[i++] = params.paymentActual;
    paramArray[i++] = params.paymentRefund==null?0:Number(params.paymentRefund);
    paramArray[i++] = params.parentPaymentId;
    paramArray[i++] = params.createdBy;
    paramArray[i++] = params.updatedBy;

    db.dbQuery(query, paramArray ,function(error,rows){
        logger.debug(' addPayment ');
        return callback(error,rows);
    });
}

module.exports = {
    getPayment : getPayment,
    addPayment : addPayment
}