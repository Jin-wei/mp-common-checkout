var commonUtil=require('mp-common-util');
var ESUtil=require('mp-es-util').ESUtil;
var responseUtil = commonUtil.responseUtil;
var sysError = commonUtil.systemError;
var Seq = require('seq');
var async = require('async');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('Search.js');
var orderDao = require('../dao/OrderDAO.js');

var orderIndexAliasSuffix="order_pinmudo";
//alernate between these two
var orderIndex1Suffix="orderindex1_pinmudo";
var orderIndex2Suffix="orderindex2_pinmudo";
var orderIndexType="order";

var orderItemIndexAliasSuffix="orderitem_pinmudo";
//alernate between these two
var orderItemIndex1Suffix="orderitemindex1_pinmudo";
var orderItemIndex2Suffix="orderitemindex2_pinmudo";
var orderItemIndexType="orderitem";

var defaultPageSize=2000;
var sysConfig = require('../config/SystemConfig.js');

var esUtil=new ESUtil(sysConfig.getElasticSearchOption(),logger);

var orderMapping= {
    'order': {
        properties: {
            "tenant": {
                "type": "keyword"
            },
            "userId": {
                "type": "long"
            },
            "bizId": {
                "type": "long"
            },
            "bizName": {
                "type": "keyword"
            },
            "amount": {
                "type": "float"
            },
            "quantity": {
                "type": "float"
            },
            "userName": {
                "type": "keyword"
            },
            "name": {
                "type": "keyword"
            },
            "phone": {
                "type": "keyword"
            },
            "address": {
                "type": "keyword"
            },
            "zipcode": {
                "type": "keyword"
            },
            "city": {
                "type": "keyword"
            },
            "state": {
                "type": "keyword"
            },
            "status": {
                "type": "keyword"
            },
            "createdOn":{
                "type": "date"
            },
            "updatedOn":{
                "type": "date"
            },
            "createdBy": {
                "type": "long"
            },
            "updatedBy": {
                "type": "long"
            },
            "statusMsg": {
                "type": "keyword"
            }
        }
    }
};

var orderItemMapping= {
    'orderitem': {
        properties: {
            "tenant": {
                "type": "keyword"
            },
            "orderId": {
                "type": "long"
            },
            "userId": {
                "type": "long"
            },
            "bizId": {
                "type": "long"
            },
            "bizName": {
                "type": "keyword"
            },
            "orderStatus": {
                "type": "keyword"
            },
            "amount": {
                "type": "float"
            },
            "quantity": {
                "type": "float"
            },
            "userName": {
                "type": "keyword"
            },
            "name": {
                "type": "keyword"
            },
            "phone": {
                "type": "keyword"
            },
            "address": {
                "type": "keyword"
            },
            "zipcode": {
                "type": "keyword"
            },
            "city": {
                "type": "keyword"
            },
            "state": {
                "type": "keyword"
            },
            "status": {
                "type": "keyword"
            },
            "createdOn":{
                "type": "date"
            },
            "updatedOn":{
                "type": "date"
            },
            "createdBy": {
                "type": "long"
            },
            "updatedBy": {
                "type": "long"
            },
            "statusMsg": {
                "type": "keyword"
            },
            "productId": {
                "type": "long"
            },
            "productName": {
                "type": "keyword"
            },
            "productCode": {
                "type": "keyword"
            },
            "unitPrice": {
                "type": "float"
            },
            "supplierId": {
                "type": "long"
            },
            "supplierName": {
                "type": "keyword"
            },
            "unitOfMeasure": {
                "type": "keyword"
            }
        }
    }
};

function doBuildOrderIndex(tenant,callback){
    var orderIndexAlias=tenant+orderIndexAliasSuffix;
    var orderIndex1=tenant+orderIndex1Suffix;
    var orderIndex2=tenant+orderIndex2Suffix;

    var indexOrder = function(sClient2,index, indexType,start,pageSize,callback){
        orderDao.queryOrder({tenant:tenant,start:start,size:pageSize}, function (error, rows) {
            if(error){
                return callback(error);
            }else {
                var orderList = rows;
                if (orderList && orderList.length > 0) {
                    Seq(orderList).seqEach(function (order, i) {
                        var that = this;
                        sClient2.create({
                            index: index,
                            type: indexType,
                            id: order.orderId,
                            body: {
                                tenant:order.tenant,
                                userId: order.userId,
                                bizId: order.bizId,
                                bizName: order.bizName,
                                amount: order.orderAmount,
                                quantity: order.orderQuantity,
                                status: order.status,
                                statusMsg: order.statusMsg,
                                createdOn: order.createdOn,
                                updatedOn: order.updatedOn,
                                createdBy: order.createdBy,
                                updatedBy: order.updatedBy,
                                userName: order.userName,
                                name: order.name,
                                phone: order.phone,
                                address: order.address,
                                city: order.city,
                                state: order.state,
                                zipcode: order.zipcode
                            }
                        }, function (error, data) {
                            //console.log(data);
                            if (error) {
                                callback(error);
                            } else {
                                that(null, i);
                            }
                        });
                    }).seq(function(){
                        return callback(null,true);
                    })
                } else {
                    return callback(null,false);
                }
            }
        });
    }
    return esUtil.doRotateIndex(orderIndexType,orderMapping,orderIndexAlias,orderIndex1,orderIndex2, indexOrder,defaultPageSize,function(err){
        callback(err);
    })
}

function doBuildOrderItemIndex(tenant,callback){
    var orderItemIndexAlias=tenant+orderItemIndexAliasSuffix;
    var orderItemIndex1=tenant+orderItemIndex1Suffix;
    var orderItemIndex2=tenant+orderItemIndex2Suffix;

    var indexOrderItem = function(sClient2,index, indexType,start,pageSize,callback){
        orderDao.queryOrderItem({tenant:tenant,start:start,size:pageSize}, function (error, rows) {
            if(error){
                return callback(error);
            }else {
                var orderItemList = rows;
                if (orderItemList && orderItemList.length > 0) {
                    Seq(orderItemList).seqEach(function (item, i) {
                        var that = this;
                        sClient2.create({
                            index: index,
                            type: indexType,
                            id: item.itemId,
                            body: {
                                tenant:item.tenant,
                                orderId:item.orderId,
                                userId: item.userId,
                                bizId: item.bizId,
                                bizName: item.bizName,
                                orderStatus: item.orderStatus,
                                amount: item.amount,
                                quantity: item.quantity,
                                status: item.status,
                                statusMsg: item.statusMsg,
                                createdOn: item.createdOn,
                                updatedOn: item.updatedOn,
                                createdBy: item.createdBy,
                                updatedBy: item.updatedBy,
                                userName: item.userName,
                                name: item.name,
                                phone: item.phone,
                                address: item.address,
                                city: item.city,
                                state: item.state,
                                zipcode: item.zipcode,
                                productId: item.productId,
                                productName: item.productName,
                                productCode: item.productCode,
                                unitPrice: item.unitPrice,
                                supplierId: item.supplierId,
                                supplierName: item.supplierName,
                                unitOfMeasure: item.unitOfMeasure
                            }
                        }, function (error, data) {
                            //console.log(data);
                            if (error) {
                                callback(error);
                            } else {
                                that(null, i);
                            }
                        });
                    }).seq(function(){
                        return callback(null,true);
                    })
                } else {
                    return callback(null,false);
                }
            }
        });
    }

    return esUtil.doRotateIndex(orderItemIndexType,orderItemMapping,orderItemIndexAlias,orderItemIndex1,orderItemIndex2, indexOrderItem,defaultPageSize,function(err){
        callback(err);
    })
}

module.exports = {
    doBuildOrderIndex:doBuildOrderIndex,
    doBuildOrderItemIndex:doBuildOrderItemIndex
};