/**
 * Created by Jie Zou on 2016/9/24.
 */
var db=require('../db/MysqlDb.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('AddressDAO.js');

function getAddress(params,callback){
    var query = " select id as addressId, user_id as userId, name, " +
        "address, city, state,zipcode ," +
        "created_on createdOn, updated_on updatedOn,created_by createdBy, updated_by updatedBy,phone,primary_flag primaryFlag from order_address where tenant=? ";
    var paramArray=[],i= 0,whereclause="";
    paramArray[i++]=params.tenant;
    if(params.addressId !=null){
        paramArray[i++]=Number(params.addressId);
        whereclause= whereclause + " and id = ? "
    }
    if(params.userId !=null){
        paramArray[i++]=Number(params.userId);
        whereclause =  whereclause + " and user_id = ? "
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
        logger.debug(' queryAddress ');
        return callback(error,rows);
    });
}

function addAddress(params,callback){
    var query  = "insert into order_address(tenant,user_id,name,address,city," +
        "state,zipcode,created_by,updated_by,phone) " +
        "values(?,?,?,?,?,?,?,?,?,?) ";
    var paramArray=[],i=0;
    paramArray[i++] = params.tenant;
    paramArray[i++] = params.userId;
    paramArray[i++] = params.name;
    paramArray[i++] = params.address;
    paramArray[i++] = params.city;
    paramArray[i++] = params.state;
    paramArray[i++] = params.zipcode;
    paramArray[i++] = params.createdBy;
    paramArray[i++] = params.updatedBy;
    paramArray[i++] = params.phone;

    db.dbQuery(query, paramArray ,function(error,rows){
        logger.debug(' addAddress ');
        return callback(error,rows);
    });
}

function updateAddress(params,callback){
    var query  = "update order_address set name=?,address=?,city=?," +
        "state=?,zipcode=?,updated_by=?,phone=? where tenant=? and id=? " ;
    var paramArray=[],i=0;
    paramArray[i++] = params.name;
    paramArray[i++] = params.address;
    paramArray[i++] = params.city;
    paramArray[i++] = params.state;
    paramArray[i++] = params.zipcode;
    paramArray[i++] = params.updatedBy;
    paramArray[i++] = params.phone;
    paramArray[i++] = params.tenant;
    paramArray[i++] = params.addressId;
    db.dbQuery(query, paramArray ,function(error,rows){
        logger.debug(' updateAddress ');
        return callback(error,rows);
    });
}

function deleteAddress(params,callback){
    var query  = "delete from order_address where tenant=? and id=? ";
    var paramArray=[],i=0;
    paramArray[i++] = params.tenant;
    paramArray[i++] = params.addressId;
    db.dbQuery(query, paramArray ,function(error,rows){
        logger.debug(' deleteAddress ');
        return callback(error,rows);
    });
}

function updateAddressPrimaryFlag(params,callback){
    var query  = 'update order_address set primary_flag = CASE ' +
    'WHEN id = ? THEN 1 ELSE 0 END '+
    'WHERE user_id=? and tenant=? ';
    var paramArray=[],i=0;
    paramArray[i++] = params.addressId;
    paramArray[i++] = params.userId;
    paramArray[i++] = params.tenant;
    db.dbQuery(query, paramArray ,function(error,rows){
        logger.debug(' updateAddressPrimaryFlag ');
        return callback(error,rows);
    });
}


module.exports = {
    getAddress : getAddress,
    addAddress : addAddress,
    updateAddress : updateAddress,
    deleteAddress : deleteAddress,
    updateAddressPrimaryFlag:updateAddressPrimaryFlag
}