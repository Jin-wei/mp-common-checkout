/**
 * Created by ling xue on 2016/3/10.
 */
var commonUtil = require('mp-common-util');
var ReturnType = require('mp-common-util').ReturnType;
var resUtil = commonUtil.responseUtil;
var orderPaymentDAO = require('../dao/OrderPaymentDAO.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('OrderPayment.js');
var Seq = require('seq');
var orderDao = require('../dao/OrderDAO.js');
var sysError = commonUtil.systemError;
var listOfValue = require('../util/ListOfValue.js');

function createPayments(req,res,next){
    var params = req.params,result=[];
    var tenant=params.tenant;
    var payments=params.payments;
    var authUser=params.authUser;
    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (payments == null) {
        return next(sysError.MissingParameterError("payments is missing", "payments is missing"));
    }
    Seq(payments).seqEach(function(payment,i){
        var that=this;
        _createPayment(tenant,authUser.userId,payment,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function _createPayment(tenant, userId,payment,callback){
    var orderId=payment.orderId,paymentNonce=payment.paymentNonce,amount=payment.paymentAmount,insertId,order,paymentId;
    if (orderId==null){
        return callback(new ReturnType(false,"orderId is missing", null));
    }
    if (paymentNonce==null){
        return callback(new ReturnType(false,"paymentNonce is missing", null));
    }

    if (amount==null){
        return callback(new ReturnType(false,"paymentAmount is missing", null));
    }

    if (payment.paymentType==null){
        return callback(new ReturnType(false,"paymentType is missing", null));
    }

    if (payment.paymentType!=listOfValue.PAYMENT_TYPE_ALIPAY && payment.paymentType!=listOfValue.PAYMENT_TYPE_WECHAT){
        return callback(new ReturnType(false,"wrong paymentType", null));
    }

    Seq().seq(function () {
        var that = this;
        orderDao.queryOrder({tenant:tenant,orderId:orderId},function (error, rows) {
            if(error){
                logger.error('createPayments '+ error.message);
                return callback(new ReturnType(false, error.message, null));
            }else {
                if (rows && rows.length > 0) {
                    order=rows[0];
                    if (listOfValue.ORDER_STATUS_PENDING != order.status) {
                        return callback(new ReturnType(false, "order is payed already", null));
                    }
                    if (amount != order.orderAmount) {
                        return callback(new ReturnType(false, "payment amount does not match orders amount", null));
                    }
                    Seq().seq(function() {
                        var that = this;
                        //add payment and change order status
                        orderPaymentDAO.addPayment({
                                tenant: tenant,
                                paymentNonce: paymentNonce,
                                orderId: orderId,
                                userId: order.userId,
                                bizId: order.bizId,
                                paymentInfo: payment.paymentInfo,
                                paymentType: payment.paymentType,
                                paymentStatus: listOfValue.PAYMENT_STATUS_SETTLEMENT,
                                paymentDue: amount,
                                paymentActual: amount,
                                parentPaymentId: payment.parentPaymentId,
                                createdBy: userId,
                                updatedBy: userId
                            }, function (error, row) {
                                if (error) {
                                    return callback(new ReturnType(false, error.message, null));
                                }else{
                                    paymentId=row.insertId;
                                    that();
                                }
                            }
                        )
                    }).seq(function(){
                        //change order status to payed
                        orderDao.updateOrderStatus({tenant:tenant,orderId:orderId,orderStatus:listOfValue.ORDER_STATUS_PAYED, updatedBy: userId},function(error,rows){
                            if (error){
                                return callback(new ReturnType(false, error.message, null));
                            }else {
                                if (rows.affectedRows>0) {
                                    return callback(new ReturnType(true, null, paymentId));
                                }else{
                                    return callback(new ReturnType(false, "fail to update order status", paymentId));
                                }
                            }
                        })
                    })
                } else {
                    return callback(new ReturnType(false, "can not find this order", null));
                }
            }
        });
    })
}

function queryPayments(req,res,next){
    var params = req.params;
    var tenant=params.tenant;
    if (tenant==null){
        //to do add new error type
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    orderPaymentDAO.getPayment(params ,function(error,rows){
        if(error){
            logger.error(' query ' + error.message);
            resUtil.resInternalError(error,res,next);
        }
        resUtil.resetQueryRes(res,rows);
        return next();
    });
}

function getConnectState(req,res,next){
    res.send(200,{success: true});
}
module.exports = {
    getConnectState:getConnectState,
    createPayments:createPayments,
    queryPayments : queryPayments
}