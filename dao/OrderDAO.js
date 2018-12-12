/**
 * Created by jie zou on 2016-03-07.
 */

var db=require('../db/MysqlDb.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('OrderDAO.js');

function createOrder(params,callback){

    var query = " insert into order_info(tenant,user_id,biz_id,biz_name,amount,quantity,status,created_by,updated_by," +
        "user_name,name,phone,address,zipcode,city,state,note)" +
        " values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    var paramArray=[],i=0;
    paramArray[i++]=params.tenant;
    paramArray[i++]=Number(params.userId);
    paramArray[i++]=Number(params.bizId);
    paramArray[i++]=params.bizName;
    paramArray[i++]=Number(params.orderAmount);
    paramArray[i++]=Number(params.orderQuantity);
    paramArray[i++]=params.status;
    paramArray[i++]=Number(params.createdBy);
    paramArray[i++]=Number(params.updatedBy);
    paramArray[i++]=params.userName;
    paramArray[i++]=params.name;
    paramArray[i++]=params.phone;
    paramArray[i++]=params.address;
    paramArray[i++]=params.zipcode;
    paramArray[i++]=params.city;
    paramArray[i++]=params.state;
    paramArray[i++]=params.note;

    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' createOrder ');
        return callback(error,rows);
    });
}

function updateOrderBizInfo(params,callback){
    var query = " update order_info set biz_id=?,biz_name=? where tenant=? and id=?";
    var paramArray=[],i=0;
    paramArray[i++]=Number(params.bizId);
    paramArray[i++]=params.bizName;
    paramArray[i++]=params.tenant;
    paramArray[i++]=Number(params.orderId);
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' updateOrder ');
        return callback(error,rows);
    });
}

function updateOrder(params,callback){
    var query = " update order_info set amount=?, quantity=?, updated_by =?," +
        "name=?,phone=?,address=?,zipcode=?,city=?,state=?,note=? where tenant=? and id=?";
    var paramArray=[],i=0;
    paramArray[i++]=Number(params.orderAmount);
    paramArray[i++]=Number(params.orderQuantity);
    paramArray[i++]=Number(params.updatedBy);
    paramArray[i++]=params.name;
    paramArray[i++]=params.phone;
    paramArray[i++]=params.address;
    paramArray[i++]=params.zipcode;
    paramArray[i++]=params.city;
    paramArray[i++]=params.state;
    paramArray[i++]=params.note;
    paramArray[i++]=params.tenant;
    paramArray[i++]=Number(params.orderId);
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' updateOrder ');
        return callback(error,rows);
    });
}

function deleteOrder(params,callback){
    var query = " delete from order_info where tenant=? and id=?";
    var paramArray=[],i=0;
    paramArray[i++]=params.tenant;
    paramArray[i++]=Number(params.orderId);
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' deleteOrder ');
        return callback(error,rows);
    });
}

function createOrderItem(params,callback){
    var query = " insert into order_item (tenant,order_Id,product_id,product_code,product_name,quantity,unit_price,amount,status," +
        "created_by,updated_by,supplier_id,supplier_name,note,unit_of_measure)" +
        " values (?, ?, ? , ?, ? , ? ,?,?,?,?,?,?,?,?,?)";
    var paramArray=[],i=0;
    paramArray[i++]=params.tenant;
    paramArray[i++]=Number(params.orderId);
    paramArray[i++]=Number(params.productId);
    paramArray[i++]=params.productCode;
    paramArray[i++]=params.productName;
    paramArray[i++]=Number(params.quantity);
    paramArray[i++]=Number(params.unitPrice);
    paramArray[i++]=Number(params.amount);
    paramArray[i++]=params.status;
    paramArray[i++]=Number(params.createdBy);
    paramArray[i++]=Number(params.updatedBy);
    paramArray[i++]=(params.supplierId!=null)?Number(params.supplierId):null;
    paramArray[i++]=params.supplierName;
    paramArray[i++]=params.itemNote;
    paramArray[i++]=params.unitOfMeasure;
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' createOrderItem ');
        return callback(error,rows);
    });
}

function updateOrderItem(params,callback){
    var query = " update order_item set product_id=?,product_code=?,product_name=?,quantity=?,unit_price=?,amount=?," +
        "updated_by=?,supplier_id=?,supplier_name=?,note=?,unit_of_measure=? " +
        "where tenant=? and order_id=? and id=? ";
    var paramArray=[],i=0;
    paramArray[i++]=Number(params.productId);
    paramArray[i++]=params.productCode;
    paramArray[i++]=params.productName;
    paramArray[i++]=Number(params.quantity);
    paramArray[i++]=Number(params.unitPrice);
    paramArray[i++]=Number(params.amount);
    paramArray[i++]=Number(params.updatedBy);
    paramArray[i++]=Number(params.supplierId);
    paramArray[i++]=params.supplierName;
    paramArray[i++]=params.itemNote;
    paramArray[i++]=params.unitOfMeasure;
    paramArray[i++]=params.tenant;
    paramArray[i++]=Number(params.orderId);
    paramArray[i++]=Number(params.itemId);
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' updateOrderItem ');
        return callback(error,rows);
    });
}

function deleteOrderItem(params,callback){
    var query = " delete from order_item where tenant=? and order_id=? and id=? ";
    var paramArray=[],i=0;
    paramArray[i++]=params.tenant;
    paramArray[i++]=Number(params.orderId);
    paramArray[i++]=Number(params.itemId);
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' deleteOrderItem ');
        return callback(error,rows);
    });
}

function queryOrder(params,callback){
    var query = " select id as orderId, user_id as userId, biz_id as bizId,biz_name as bizName,amount orderAmount," +
        "quantity orderQuantity,status,status_msg statusMsg, " +
        "created_on createdOn, updated_on updatedOn,created_by createdBy, updated_by updatedBy,user_name userName," +
        "name,phone,address,city,state,zipcode,note from order_info where ";
    var paramArray=[],i= 0,whereclause="";
    whereclause=_getQueryOrderWhereClause(paramArray,params);
    i=paramArray.length;
    query = query +whereclause+" order by id desc ";
    if(params.start!=null && params.size){
        query= query + " limit ? , ? "
        paramArray[i++] = Number(params.start);
        paramArray[i++] = Number(params.size);
    }
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' queryOrder ');
        return callback(error,rows);
    });
}


function queryOrderCount(params,callback){
    var query = " select count(*) as count from order_info where ";
    var paramArray=[],whereclause="";
    whereclause=_getQueryOrderWhereClause(paramArray,params);
    query = query +whereclause;
    logger.debug(' query '+query);
    logger.debug(' paramArray length '+paramArray.length);
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' queryOrder ');
        return callback(error,rows);
    });
}

function _getQueryOrderWhereClause(paramArray,params){
    var whereclause="tenant=?";
    var i=0;
    paramArray[i++]=params.tenant;
    if(params.orderId !=null){
        paramArray[i++]=Number(params.orderId);
        whereclause= whereclause + " and id = ? "
    }
    if(params.userId !=null){
        paramArray[i++]=Number(params.userId);
        whereclause =  whereclause + " and user_id = ? "
    }

    if(params.userName !=null){
        paramArray[i++]='%'+params.userName+'%';
        whereclause =  whereclause + " and user_name like ? "
    }

    if(params.bizId !=null){
        paramArray[i++]=Number(params.bizId);
        whereclause =  whereclause + " and biz_id = ? "
    }
    if(params.bizName !=null){
        paramArray[i++]='%'+params.bizName+'%';
        whereclause =  whereclause + " and biz_name like ? "
    }
    if(params.phone !=null){
        paramArray[i++]=params.phone;
        whereclause =  whereclause + " and phone = ? "
    }
    if(params.name !=null){
        paramArray[i++]='%'+params.name+'%';
        whereclause =  whereclause + " and name like ? "
    }
    if(params.status){
        paramArray[i++]=params.status;
        whereclause =  whereclause + " and status = ? "
    }
    if(params.startDate){
        paramArray[i++] = params.startDate;
        whereclause = whereclause + " and created_on >= ? "
    }

    if (params.endDate){
        paramArray[i++] = params.endDate;
        whereclause = whereclause + " and created_on <= ? "
    }
    return whereclause;
}

function queryOrderItem(params,callback){
    var query = " select o.id as orderId, o.user_id as userId, o.biz_id as bizId,o.biz_name as bizName,o.quantity orderQuantity,o.amount orderAmount," +
        "o.status orderStatus,o.status_msg orderStatusMsg,o.name,o.user_name userName," +
        "o.name,o.phone,o.address,o.city,o.state,o.zipcode,o.note,oi.id itemId, " +
        "oi.product_id productId,oi.product_name productName,oi.product_code productCode,oi.quantity, oi.unit_price unitPrice,oi.amount," +
        "oi.created_on createdOn, oi.updated_on updatedOn,oi.status,oi.created_by createdBy, oi.updated_by updatedBy," +
        "oi.supplier_id supplierId, oi.supplier_name supplierName,oi.note itemNote,oi.unit_of_measure unitOfMeasure from order_info o, " +
        " order_item oi where o.id=oi.order_id ";
    var paramArray=[],i=0;
    var whereClause=_getQueryOrderItemWhereClause(paramArray,params);
    i=paramArray.length;
    query = query +whereClause+" order by oi.id desc "
    if(params.start!=null && params.size){
        paramArray[i++] = Number(params.start);
        paramArray[i++] = Number(params.size);
        query = query + " limit ? , ? "
    }
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' queryOrder Item ');
        return callback(error,rows);
    });
}


function queryOrderItemCount(params,callback){
    var query = " select count(*) as count from order_info o, " +
        " order_item oi where o.id=oi.order_id ";
    var paramArray=[],i=0;
    whereClause=_getQueryOrderItemWhereClause(paramArray,params);

    query = query +whereClause+" order by oi.id desc "
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' queryOrder Item ');
        return callback(error,rows);
    });
}

function _getQueryOrderItemWhereClause(paramArray,params){
    var query="and o.tenant=?";
    var i=0;
    paramArray[i++]=params.tenant;

    if(params.orderId !=null){
        paramArray[i++]=Number(params.orderId);
        query = query + " and o.id = ? "
    }
    if(params.bizId !=null){
        paramArray[i++]=Number(params.bizId);
        query = query + " and o.biz_id = ? "
    }

    if(params.itemId !=null){
        paramArray[i++]=Number(params.itemId);
        query = query + " and oi.id = ? "
    }
    if(params.userId !=null){
        paramArray[i++]=Number(params.userId);
        query = query + " and o.user_id= ? "
    }
    if(params.orderStatus !=null){
        paramArray[i++]=Number(params.orderStatus);
        query = query + " and o.status= ? "
    }
    if(params.phone !=null){
        paramArray[i++]=params.phone;
        query = query + " and o.phone= ? "
    }
    if(params.name !=null){
        paramArray[i++]='%'+params.name+'%';
        query = query + " and o.name like ? "
    }

    if(params.bizName !=null){
        paramArray[i++]='%'+params.bizName+'%';
        query = query + " and o.biz_name like ? "
    }

    if(params.userName !=null){
        paramArray[i++]='%'+params.userName+'%';
        query = query + " and o.user_name like ? "
    }

    if(params.status !=null){
        paramArray[i++]=Number(params.status);
        query = query + " and oi.status= ? "
    }
    if(params.startDate) {
        paramArray[i++] = params.startDate;
        query = query + " and oi.created_on >= ? "
    }

    //exclude the start date
    if(params.startAfterDate) {
        paramArray[i++] = params.startAfterDate;
        query = query + " and oi.created_on > ? "
    }

    if (params.supplierId){
        paramArray[i++] = Number(params.supplierId);
        query = query + " and oi.supplier_id = ? "
    }
    if (params.supplierName){
        paramArray[i++] = params.supplierName;
        query = query + " and oi.supplier_name = ? "
    }
    if (params.endDate){
        paramArray[i++] = params.endDate;
        query = query + " and oi.created_on <= ? "
    }
    return query;
}


function queryOrderUserBalance(params,callback){
    var query = " select id, user_id as userId, amount,quantity,balance,created_on createdOn,updated_on updatedOn " +
        "from order_user_balance where tenant=? and user_id=?";
    var paramArray=[],i=0;
    paramArray[i++]=params.tenant;
    paramArray[i++]=params.params.userId;
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' query Order user balance ');
        return callback(error,rows);
    });
}

function upsertOrderUserBalance(params,callback){
    var i= 0,paramArray=[];
    var query = "update order_user_balance set ";
    if (params.amount){
        query+=" amount=amount+ ?";
        paramArray[i++]=Number(params.amount);
    }
    if (params.quantity){
       if (i>0){
           query+=",";
       }
       query+=" quantity=quantity+ ?"
       paramArray[i++]=Number(params.quantity);
    }
    if (params.balance){
        if (i>0){
            query+=",";
        }
        query+=" balance=balance+ ?"
        paramArray[i++]=Number(params.balance);
    }
    query+=" where tenant=? and user_id=?";
    paramArray[i++]=params.tenant;
    paramArray[i++]=Number(params.userId);
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug('update Order user balance ');
        console.log("updated order user balance.....");
        console.dir(rows);
        if (rows.changedRows<=0){
            query="insert into order_user_balance(amount,quantity,balance,tenant,user_id) values(?,?,?,?,?)";
            db.dbQuery(query,paramArray,function(error,rows){
                return callback(error,rows);
            });
        }else {
            return callback(error, rows);
        }
    });
}

function updateOrderStatus(params,callback){
    var i= 0,paramArray=[];
    var query = "update order_info set status=?, status_msg=?,updated_by=? where id=? and tenant=? and status<>? ";
    paramArray[i++]=params.orderStatus;
    paramArray[i++]=params.statusMsg;
    paramArray[i++]=Number(params.updatedBy);
    paramArray[i++]=Number(params.orderId);
    paramArray[i++]=params.tenant;
    paramArray[i++]=params.orderStatus;

    db.dbQuery(query,paramArray,function(error,rows) {
       return callback(error, rows);
    });
}

function updateOrderItemStatus(params,callback){
    var i= 0,paramArray=[];
    var query = "update order_item set status=?, updated_by=? where id=? and tenant=? and status<>?";
    paramArray[i++]=params.status;
    paramArray[i++]=Number(params.updatedBy);
    paramArray[i++]=Number(params.itemId);
    paramArray[i++]=params.tenant;
    paramArray[i++]=params.status;

    db.dbQuery(query,paramArray,function(error,rows) {
        return callback(error, rows);
    });
}

function updateBizOrderInformation(params,callback){
    var paramArray=[],i=0;
    var query = " update order_info set state=?, city=?, address=?, note=? where tenant=? and biz_id=? and id=?";
    paramArray[i++]=params.state;
    paramArray[i++]=params.city;
    paramArray[i++]=params.address;
    paramArray[i++]=params.note;
    paramArray[i++]=params.tenant;
    paramArray[i++]=params.bizId;
    paramArray[i++]=Number(params.orderId);
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' updateOrder ');
        return callback(error,rows);
    });
}

module.exports = {
    createOrder : createOrder,
    updateOrder : updateOrder,
    deleteOrder : deleteOrder,
    updateOrderBizInfo:updateOrderBizInfo,
    createOrderItem : createOrderItem,
    updateOrderItem : updateOrderItem,
    deleteOrderItem : deleteOrderItem,
    queryOrder : queryOrder ,
    queryOrderCount:queryOrderCount,
    queryOrderItem : queryOrderItem,
    updateOrderStatus:updateOrderStatus,
    updateOrderItemStatus:updateOrderItemStatus,
    queryOrderUserBalance: queryOrderUserBalance,
    upsertOrderUserBalance:upsertOrderUserBalance,
    queryOrderItemCount:queryOrderItemCount,
    updateBizOrderInformation: updateBizOrderInformation
}