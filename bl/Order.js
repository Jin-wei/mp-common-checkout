/**
 * Created by jie zou on 1016-3-07.
 */
var commonUtil = require('mp-common-util');
var orderDao = require('../dao/OrderDAO.js');
var Seq = require('seq');
var sysMsg = require('mp-common-util').systemMsg;
var serverLogger = require('../util/ServerLogger.js');
var resUtil = commonUtil.responseUtil;
var ReturnType = commonUtil.ReturnType;
var logger = serverLogger.createLogger('Order.js');
var listOfValue = require('../util/ListOfValue.js');
var history=require('./History.js');

/**end user create order
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function createUserOrders(req,res,next){
    var params = req.params,result=[];
    var tenant=params.tenant;
    var orders=params.orders;
    var userId=params.userId;
    var authUser=params.authUser;
    var userName=authUser.name;
    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (orders == null) {
        return next(sysError.MissingParameterError("orders is missing", "orders is missing"));
    }
    if(userId != authUser.userId){
        return resUtil.resNoAuthorizedError(null,res,next);
    }

    Seq(orders).seqEach(function(order,i){
        var that=this;
        order.userId=userId;
        order.userName=userName;
        _createOrder(tenant,authUser,order,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

/**end user create order
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function updateUserOrders(req,res,next){
    var params = req.params,result=[];
    var tenant=params.tenant;
    var orders=params.orders;
    var userId=params.userId;
    var authUser=params.authUser;
    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (orders == null) {
        return next(sysError.MissingParameterError("orders is missing", "orders is missing"));
    }
    if(userId != authUser.userId){
        return resUtil.resNoAuthorizedError(null,res,next);
    }

    Seq(orders).seqEach(function(order,i){
        var that=this;
        _updateOrder(tenant,authUser.userId,order,true,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function deleteUserOrders(req,res,next){
    var params = req.params,result=[];
    var tenant=params.tenant;
    var orders=params.orders;
    var userId=params.userId;
    var authUser=params.authUser;
    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (orders == null) {
        return next(sysError.MissingParameterError("orders is missing", "orders is missing"));
    }
    if(userId != authUser.userId){
        return resUtil.resNoAuthorizedError(null,res,next);
    }

    Seq(orders).seqEach(function(order,i){
        var that=this;
        _deleteOrder(tenant,authUser.userId,order,true,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function _createOrder(tenant,authUser,order, callback){
    var itemArray = order.items, i,orderAmount=0,orderQuantity=0,orderId;
    if( order.userId== null){
        return callback(new ReturnType(false,"userId is missing",null));
    }
    if( order.bizId== null){
        return callback(new ReturnType(false,"bizId is missing",null));
    }
    if(itemArray == null || itemArray.length<1){
        return callback(new ReturnType(false,"order items is missing",null));
    }

    for(i=0;i<itemArray.length;i++){
        if (itemArray[i].productId==null){
            return callback(new ReturnType(false,"product id is missing",null));
        }
        if (itemArray[i].productName==null){
            return callback(new ReturnType(false,"product name is missing",null));
        }
        if (itemArray[i].unitPrice==null){
            return callback(new ReturnType(false,"product unit price is missing",null));
        }
        if (itemArray[i].quantity==null ){
            return callback(new ReturnType(false,"product quantity is missing",null));
        }
        itemArray[i].amount=itemArray[i].unitPrice*itemArray[i].quantity;
        orderAmount+=itemArray[i].amount;
        orderQuantity+=itemArray[i].quantity;
    }
    Seq().seq(function(){
        var that = this;
        orderDao.createOrder({
            tenant:tenant,
            bizId: order.bizId,
            bizName: order.bizName,
            userId:order.userId,
            orderAmount:orderAmount,
            orderQuantity:orderQuantity,
            status: listOfValue.ORDER_STATUS_PENDING,
            createdBy:authUser.userId,
            updatedBy:authUser.userId,
            name:order.name,
            userName: order.userName,
            phone: order.phone,
            city:order.city,
            state:order.state,
            address:order.address,
            zipcode:order.zipcode,
            note:order.note
        } ,function(error,result){
            if (error) {
                logger.error(' createOrder ' + error.message);
                return callback(new ReturnType(false,error.message,null));
            } else {
                if(result && result.insertId>0){
                    orderId = result.insertId;
                    //create order history
                    history.createOrderHistory(tenant,authUser,orderId,"order created with status:"+listOfValue.ORDER_STATUS_PENDING,
                        function(err,result){
                            //do nothing
                    });
                    that();
                }else{
                    logger.error(' createOrder ' + " failed");
                    return callback(new ReturnType(false,"User create order failed",null));
                }
            }
        })
    }).seq(function() {
        var that = this;
        Seq(itemArray).seqEach(function (item, i) {
            var that = this;
            item.orderId = orderId;
            item.tenant = tenant;
            item.status = listOfValue.ORDER_ITEM_STATUS_PENDING;
            item.createdBy = authUser.userId;
            item.updatedBy = authUser.userId;

            orderDao.createOrderItem(item, function (err, rows) {
                if (err) {
                    logger.error(' createOrderItem ' + err.message);
                    return callback(new ReturnType(false, err.message, null));
                } else {
                    that(null, i);
                }
            });
        }).seq(function () {
            return callback(new ReturnType(true, null, orderId));
        })
    })
}

function _updateOrder(tenant,userId,order,updateUserOrder,callback){
    var itemArray = order.items, i, j,orderAmount=0,orderQuantity=0,orderId,filter,
        existingOrder,existingItems;

    orderId=order.orderId;
    if( orderId== null){
        return callback(new ReturnType(false,"orderId is missing",null));
    }

    if(itemArray == null || itemArray.length<1){
        return callback(new ReturnType(false,"order items is missing",orderId));
    }

    filter={tenant:tenant,orderId:orderId};
    //find this order first
    orderDao.queryOrder(filter,function(error,rows){
        if (error){
            return callback(new ReturnType(false,error.message,orderId));
        }
        if(rows.length<=0){
            return callback(new ReturnType(false,"order not found",orderId));
        }
        existingOrder=rows[0];
        //check this order belongs to this user
        if (updateUserOrder &&  existingOrder.userId !=userId){
            return callback(new ReturnType(false,"order can not be updated",orderId));
        }

        if (listOfValue.ORDER_STATUS_PENDING!=existingOrder.status){
            return callback(new ReturnType(false,"order can not be updated",orderId));
        }

        //validate order item
        for(i=0;i<itemArray.length;i++){
            if (itemArray[i].productId==null){
                return callback(new ReturnType(false,"product id is missing",orderId));
            }
            if (itemArray[i].productName==null){
                return callback(new ReturnType(false,"product name is missing",orderId));
            }
            if (itemArray[i].unitPrice==null){
                return callback(new ReturnType(false,"product unit price is missing",orderId));
            }
            if (itemArray[i].quantity==null ){
                return callback(new ReturnType(false,"product quantity is missing",orderId));
            }
            itemArray[i].amount=itemArray[i].unitPrice*itemArray[i].quantity;
            orderAmount+=itemArray[i].amount;
            orderQuantity+=itemArray[i].quantity;
        }

        //start update
        Seq().seq(function(){
            var that = this;
            orderDao.queryOrderItem({
                orderId:orderId,
                tenant:tenant
            } ,function(error,rows){
                if (error) {
                    logger.error(' queryOrderItems ' + error.message);
                    return callback(new ReturnType(false,error.message,orderId));
                } else {
                    existingItems=rows;
                    that();
                }
            })
        })
            .seq(function(){
                var that = this;
                orderDao.updateOrder({
                    orderId:orderId,
                    tenant:tenant,
                    orderAmount:orderAmount,
                    orderQuantity:orderQuantity,
                    updatedBy:userId,
                    name:order.name,
                    phone: order.phone,
                    city:order.city,
                    state:order.state,
                    address:order.address,
                    zipcode:order.zipcode,
                    note:order.note
                } ,function(error,rows){
                    if (error) {
                        logger.error(' updateOrder ' + error.message);
                        return callback(new ReturnType(false,error.message,orderId));
                    } else {
                        if(rows.affectedRows>0) {
                            that();
                        }else{
                            return callback(new ReturnType(false,"order is not updated",orderId));
                        }
                    }
                })
            }).seq(function() {
                var that=this;
                Seq(itemArray).seqEach(function (item, i) {
                    var that = this;
                    if (item.itemId ==null){
                        item.orderId = orderId;
                        item.tenant=tenant;
                        item.status=listOfValue.ORDER_ITEM_STATUS_PENDING;
                        item.createdBy=userId;
                        item.updatedBy=userId;

                        orderDao.createOrderItem(item, function (err, rows) {
                            if (err) {
                                logger.error(' createOrderItem ' + err.message);
                                return callback(new ReturnType(false,err.message,orderId));
                            }else{
                                that(null,i);
                            }
                        });
                    }else{
                        item.orderId = orderId;
                        item.tenant=tenant;
                        item.updatedBy=userId;
                        orderDao.updateOrderItem(item, function (err, rows) {
                            if (err) {
                                logger.error(' updateOrderItem ' + err.message);
                                return callback(new ReturnType(false,err.message,orderId));
                            }else{
                                //mark on existing ones which is updated
                                for (j=0;j<existingItems.length;j++){
                                    if (existingItems[j].itemId==item.itemId){
                                        existingItems[j].updatedFlag=true;
                                        break;
                                    }
                                }
                                that(null,i);
                            }
                        });
                    }
                }).seq(function(){that();})

            }).seq(function() {
                //delete the ones not updated
                var that=this;
                Seq(existingItems).seqEach(function (item, i) {
                    var that = this;
                    if (item.updatedFlag ==null || item.updatedFlag==false){

                        orderDao.deleteOrderItem({orderId: orderId,itemId:item.itemId,tenant:tenant}, function (err, rows) {
                            if (err) {
                                logger.error(' deleteOrderItem ' + err.message);
                                return callback(new ReturnType(false,err.message,orderId));
                            }else{
                                that(null,i);
                            }
                        });
                    }else{
                        that(null,i);
                    }
                }).seq(function(){
                    return callback(new ReturnType(true, null, orderId));
                })

            })
    })
}

function updateOrdersBiz(req,res,next){
    var params = req.params,result=[];
    var tenant=params.tenant;
    var orders=params.orders;
    var authUser=params.authUser;
    var userId=authUser.useId;

    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (orders == null) {
        return next(sysError.MissingParameterError("orders is missing", "orders is missing"));
    }

    Seq(orders).seqEach(function(order,i){
        var that=this;
        _updateOrderBiz(tenant,userId,order,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

//user update an order status

function updateUserOrderStatus(req,res,next){
    var params = req.params,result=[];
    var tenant=params.tenant;
    var userId=params.userId;
    var orderId=params.orderId;
    var orderStatus=params.orderStatus;
    var statusMsg=params.statusMsg;
    var authUser=params.authUser;
    if (authUser.userId !=userId){
        return resUtil.resNoAuthorizedError(null,res,next);
    }
    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    //limit user order status change action??
    //todo open up more?
    if (orderStatus!=listOfValue.ORDER_STATUS_CONFIRMED && orderStatus!=listOfValue.ORDER_STATUS_COMPLETED
        && orderStatus!=listOfValue.ORDER_STATUS_CANCELED){
        return resUtil.resetFailedRes(res,"invalid operation",next);
    }
     _updateOrderStatus(tenant,userId,{tenant:tenant,userId:userId,orderId:orderId},{orderId:orderId,orderStatus:orderStatus,statusMsg:statusMsg},function(returnResult){
            if (returnResult.success){
                return resUtil.resetSuccessRes(res,next);
            }else{
                return resUtil.resetFailedRes(res,returnResult.msg,next);
            }
        });
}

function updateUserOrderItemStatus(req,res,next){
    var params = req.params,result=[];
    var tenant=params.tenant;
    var userId=params.userId;
    var itemId=params.itemId;
    var status=params.status;
    var authUser=params.authUser;
    if (authUser.userId !=userId){
        return resUtil.resNoAuthorizedError(null,res,next);
    }
    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }

    //todo open up more?
    if (status!=listOfValue.ORDER_ITEM_STATUS_RECEIVED){
        return resUtil.resetFailedRes(res,"invalid operation",next);
    }
    _updateOrderItemStatus(tenant,userId,{tenant:tenant,userId:userId,itemId:itemId},{itemId:itemId,status:status},function(returnResult){
        if (returnResult.success){
            return resUtil.resetSuccessRes(res,next);
        }else{
            return resUtil.resetFailedRes(res,returnResult.msg,next);
        }
    });
}


function updateOrdersStatus(req,res,next){
    var params = req.params,result=[];
    var tenant=params.tenant;
    var orders=params.orders;
    var authUser=params.authUser;
    var userId=authUser.userId;

    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (orders == null) {
        return next(sysError.MissingParameterError("orders is missing", "orders is missing"));
    }

    Seq(orders).seqEach(function(order,i){
        var that=this;
        _updateOrderStatus(tenant,userId,{tenant:tenant,orderId:order.orderId},order,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function updateBizOrdersStatus(req,res,next){
    var params = req.params,result=[];
    var tenant=params.tenant;
    var orders=params.orders;
    var bizId=params.bizId;
    var authUser=params.authUser;
    var userId=authUser.userId;
    var authBizId=authUser.bizId;

    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (orders == null) {
        return next(sysError.MissingParameterError("orders is missing", "orders is missing"));
    }
    if (bizId != authBizId){
        return resUtil.resNoAuthorizedError(null,res,next);
    }

    Seq(orders).seqEach(function(order,i){
        var that=this;
        _updateOrderStatus(tenant,userId,{bizId:bizId,tenant:tenant,orderId:order.orderId},order,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function updateOrderItemsStatus(req,res,next){
    var params = req.params,result=[];
    var tenant=params.tenant;
    var orderItems=params.orderItems;
    var authUser=params.authUser;
    var userId=authUser.userId;

    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (orderItems == null) {
        return next(sysError.MissingParameterError("orderItems is missing", "orderItems is missing"));
    }

    Seq(orderItems).seqEach(function(orderItem,i){
        var that=this;
        _updateOrderItemStatus(tenant,userId,{tenant:tenant},orderItem,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function updateBizOrderItemsStatus(req,res,next){
    var params = req.params,result=[];
    var tenant=params.tenant;
    var bizId=params.bizId;
    var orderItems=params.orderItems;
    var authUser=params.authUser;
    var userId=authUser.userId;
    var authBizId=authUser.bizId;

    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (orderItems == null) {
        return next(sysError.MissingParameterError("orderItems is missing", "orderItems is missing"));
    }
    if (bizId != authBizId){
        return resUtil.resNoAuthorizedError(null,res,next);
    }

    Seq(orderItems).seqEach(function(orderItem,i){
        var that=this;
        _updateOrderItemStatus(tenant,userId,{tenant:tenant,bizId:bizId},orderItem,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function _deleteOrder(tenant,userId, order, deleteUserOrder,callback){
    if( order.orderId== null){
        return callback(new ReturnType(false,"orderId is missing",null));
    }
    var filter={tenant:tenant,orderId: order.orderId};
    //find this order first
    orderDao.queryOrder(filter,function(error,rows){
        if (error){
            return callback(new ReturnType(false,error.message,orderId));
        }
        if(rows.length<=0){
            return callback(new ReturnType(false,"order not found",orderId));
        }
        existingOrder=rows[0];
        //check this order belongs to this user
        if (deleteUserOrder &&  existingOrder.userId !=userId){
            return callback(new ReturnType(false,"order can not be deleted",orderId));
        }

        if (listOfValue.ORDER_STATUS_PENDING!=existingOrder.status){
            return callback(new ReturnType(false,"order can not be deleted",orderId));
        }
        orderDao.deleteOrder(filter,function(error,result){
            if (error) {
                logger.error(' deleterOrder ' + error.message);
                return callback(new ReturnType(false,error.message,orderId));
            } else {
                return callback(new ReturnType(true,null,null));
            }
        })
    });
}

function _updateOrderBiz(tenant,userId, order, callback){
    if( order.orderId== null){
        return callback(new ReturnType(false,"orderId is missing",null));
    }
    if( order.bizId== null){
        return callback(new ReturnType(false,"bizId is missing",null));
    }

    if( order.bizName== null){
        return callback(new ReturnType(false,"bizName is missing",null));
    }
    //find this order first
    orderDao.updateOrderBizInfo({tenant:tenant,orderId: order.orderId,bizId:order.bizId,bizName:order.bizName},function(error,rows){
        if (error){
            return callback(new ReturnType(false,error.message,orderId));
        }
        if(rows.affectedRows<=0){
            return callback(new ReturnType(false,"order not found",orderId));
        }
        return callback(new ReturnType(true,null, order.orderId));
    });
}

function _updateOrderStatus(tenant,updatedBy,orderFilter,order, callback){
    var orderId=order.orderId,orderStatus=order.orderStatus,statusMsg=order.statusMsg;
    if( orderId== null){
        return callback(new ReturnType(false,"orderId is missing",null));
    }
    if( orderStatus== null){
        return callback(new ReturnType(false,"order status is missing",null));
    }
    if (orderStatus!=listOfValue.ORDER_STATUS_CANCELED && orderStatus!=listOfValue.ORDER_STATUS_COMPLETED
        && orderStatus!=listOfValue.ORDER_STATUS_PAYED && orderStatus!=listOfValue.ORDER_STATUS_PENDING
        && orderStatus!=listOfValue.ORDER_STATUS_CONFIRMED){
        return callback(new ReturnType(false,"invalid order status",null));
    }
    orderDao.queryOrder(orderFilter,function(err,rows){
        if (err){
            return callback(new ReturnType(false,err.message,orderId));
        }
        if (rows==null || rows.length<=0){
            return callback(new ReturnType(false,"order not found",orderId));
        }
        //find this order first
        orderDao.updateOrderStatus({tenant:tenant,orderId: orderId,orderStatus:orderStatus,statusMsg:statusMsg,updatedBy:updatedBy},function(error,rows){
            if (error){
                return callback(new ReturnType(false,error.message,orderId));
            }
            if(rows.affectedRows<=0){
                return callback(new ReturnType(false,"order status is not changed",orderId));
            }
            return callback(new ReturnType(true,null, orderId));
        });
    })
}

function _updateOrderItemStatus(tenant,userId,filter,orderItem, callback){
    var itemId=orderItem.itemId,status=orderItem.status,params={tenant:tenant,itemId:itemId};
    if( itemId== null){
        return callback(new ReturnType(false,"itemId is missing",null));
    }
    if( status== null){
        return callback(new ReturnType(false,"status is missing",null));
    }

    if( status !=listOfValue.ORDER_ITEM_STATUS_CANCELED && status!=listOfValue.ORDER_ITEM_STATUS_PENDING
        && status !=listOfValue.ORDER_ITEM_STATUS_SHIPPED && status !=listOfValue.ORDER_ITEM_STATUS_RECEIVED){
        return callback(new ReturnType(false,"invalid order item status",null));
    }
    orderDao.queryOrderItem(filter,function(err,rows){
        if (err){
            return callback(new ReturnType(false,err.message,itemId));
        }
        if (rows==null || rows.length<=0){
            return callback(new ReturnType(false,"orderItem not found",itemId));
        }
        //find this order first
        orderDao.updateOrderItemStatus({tenant:tenant,itemId:itemId,status:status,updatedBy:userId},function(error,rows){
            if (error){
                return callback(new ReturnType(false,error.message,itemId));
            }
            if(rows.affectedRows<=0){
                return callback(new ReturnType(false,"orderItem status is not updated",itemId));
            }
            return callback(new ReturnType(true,null, itemId));
        });
    })
}

function queryUserOrders(req,res,next){
    return _queryOrders(true,false,req,res,next);
}

function queryOrders(req,res,next){
    return _queryOrders(false,false,req,res,next);
}

function queryBizOrders(req,res,next){
    return _queryOrders(false,true,req,res,next);
}


function _queryOrders(queryUserOrder,queryBizOrder,req,res,next){
    var params = req.params;
    var tenant =params.tenant;
    var userId=params.userId;
    var bizId=params.bizId;
    var authUser=params.authUser;
    var total=0;

    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (queryUserOrder){
        if(userId != authUser.userId){
            return resUtil.resNoAuthorizedError(null,res,next);
        }
    }
    if (queryBizOrder){
        if(bizId != authUser.bizId){
            return resUtil.resNoAuthorizedError(null,res,next);
        }
    }
    orderDao.queryOrderCount(params,function(error,rows){
        if (error) {
            logger.error(' queryOrder ' + error.message);
            resUtil.resInternalError(error,res,next);
        } else {
            total=rows[0].count;
            if (total>0){
                orderDao.queryOrder(params ,function(error,rows){
                    if (error) {
                        logger.error(' queryOrder ' + error.message);
                        return resUtil.resInternalError(error,res,next);
                    } else {
                        return resUtil.resetQueryResWithTotal(res,rows,total,next);
                    }
                })
            }else{
                return resUtil.resetQueryResWithTotal(res,[],0,next);
            }

        }
    })
}

function _queryOrderItems(queryUserOrderItem,queryBizOrderItem,req,res,next) {
    var params = req.params;
    var tenant =params.tenant;
    var userId=params.userId;
    var bizId=params.bizId;
    var authUser=params.authUser;
    var total=0;
    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (queryUserOrderItem) {
        if (userId != authUser.userId) {
            return resUtil.resNoAuthorizedError(null, res, next);
        }
    }
    if (queryBizOrderItem) {
        if (bizId != authUser.bizId) {
            return resUtil.resNoAuthorizedError(null, res, next);
        }
    }
    orderDao.queryOrderItemCount(params, function (error, rows) {
        if (error) {
            logger.error(' queryOrderItem ' + error.message);
            resUtil.resInternalError(error,res,next);
        } else {
            total=rows[0].count;
            if(total>0){
                orderDao.queryOrderItem(params, function (error, rows) {
                    if (error) {
                        logger.error(' queryOrderItem ' + error.message);
                        return resUtil.resInternalError(error,res,next);
                    } else {
                        return resUtil.resetQueryResWithTotal(res,rows,total,next);
                    }
                })
            }else{
                return resUtil.resetQueryResWithTotal(res,[],0,next);
            }
        }
    })

}

function queryOrderItems(req,res,next) {
    return _queryOrderItems(false,false,req,res,next);
}

function queryUserOrderItems(req,res,next) {
    return _queryOrderItems(true,false,req,res,next);
}

function queryBizOrderItems(req,res,next) {
    return _queryOrderItems(false,true,req,res,next);
}


function queryOrderUserBalance(req,res,next) {
    var params = req.params;
    var tenant=params.tenant;
    if (tenant==null){
        //to do add new error type
        return  resUtil.resetFailedRes(res, sysMsg.TENANT_NOT_EXIST);
    }
    var result = {};
    orderDao.queryOrderUserBalance(params, function (error, rows) {
        if (error) {
            logger.error(' query Order user balance ' + error.message);
            resUtil.resInternalError(error,res,next);
        } else {
            if (rows.length>0) {
                result = rows[0];
            }
            resUtil.resetQueryRes(res,result,null);
            return next();
        }
    })
}

function getOrderStatus(req,res,next){
    var status=
        [listOfValue.ORDER_STATUS_PENDING,
            listOfValue.ORDER_STATUS_PAYED,
            listOfValue.ORDER_STATUS_CONFIRMED,
            listOfValue.ORDER_STATUS_COMPLETED,
            listOfValue.ORDER_STATUS_CANCELED];
    resUtil.resetQueryRes(res,status,null);
}

function getOrderItemStatus(req,res,next){
    var status=
        [listOfValue.ORDER_ITEM_STATUS_PENDING,
            listOfValue.ORDER_ITEM_STATUS_SHIPPED,
            listOfValue.ORDER_ITEM_STATUS_RECEIVED];
    resUtil.resetQueryRes(res,status,null);
}

//update biz order, include state、city、address and note
function updateBizOrderInformation(req, res, next) {
    var params = req.params,result=[];
    var tenant=params.tenant;
    var bizId=params.bizId;
    var orderId=params.orderId;
    var state=params.state;
    var city=params.city;
    var address=params.address;
    var note=params.note;

    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }

    _updateBizOrderInformation(tenant,{tenant:tenant, bizId:bizId, orderId:orderId},{orderId:orderId, state:state, city:city, address:address, note:note},function(returnResult){
        if (returnResult.success){
            return resUtil.resetSuccessRes(res,next);
        }else{
            return resUtil.resetFailedRes(res,returnResult.msg,next);
        }
    });
}

function _updateBizOrderInformation(tenant,orderFilter,order, callback){
    var bizId=orderFilter.bizId;
    var orderId=order.orderId;
    var state=order.state;
    var city=order.city;
    var address=order.address;
    var note=order.note;
    if( orderId== null){
        return callback(new ReturnType(false,"orderId is missing",null));
    }
    if( bizId == null){
        return callback(new ReturnType(false,"bizId is missing",null));
    }
    orderDao.queryOrder(orderFilter,function(err,rows){
        if (err){
            return callback(new ReturnType(false,err.message,orderId));
        }
        if (rows==null || rows.length<=0){
            return callback(new ReturnType(false,"order not found",orderId));
        }
        //find this order first
        orderDao.updateBizOrderInformation({tenant: tenant,bizId: bizId, orderId: orderId, state:state, city:city, address:address, note:note},function(error,rows){
            if (error){
                return callback(new ReturnType(false,error.message,orderId));
            }
            if(rows.affectedRows<=0){
                return callback(new ReturnType(false,"order information is not changed",orderId));
            }
            return callback(new ReturnType(true,null, orderId));
        });
    })
}

module.exports = {
    createUserOrders: createUserOrders,
    updateUserOrders: updateUserOrders,
    updateUserOrderStatus: updateUserOrderStatus,
    updateUserOrderItemStatus: updateUserOrderItemStatus,
    deleteUserOrders: deleteUserOrders,
    queryUserOrders : queryUserOrders ,
    queryUserOrderItems : queryUserOrderItems,
    queryBizOrders : queryBizOrders ,
    queryBizOrderItems : queryBizOrderItems,
    queryOrders : queryOrders ,
    queryOrderItems : queryOrderItems,
    updateOrdersBiz: updateOrdersBiz,
    updateOrdersStatus:updateOrdersStatus,
    updateOrderItemsStatus:updateOrderItemsStatus,
    updateBizOrdersStatus:updateBizOrdersStatus,
    updateBizOrderItemsStatus:updateBizOrderItemsStatus,
    getOrderStatus:getOrderStatus,
    getOrderItemStatus:getOrderItemStatus,
    updateBizOrderInformation: updateBizOrderInformation
};

