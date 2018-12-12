/**
 * Created by ling xue on 2016/3/10.
 */

var commonUtil = require('mp-common-util');
var ReturnType = require('mp-common-util').ReturnType;
var resUtil = commonUtil.responseUtil;
var addressDAO = require('../dao/AddressDAO.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('Address.js');
var Seq = require('seq');
var sysError = commonUtil.systemError;
var listOfValue = require('../util/ListOfValue.js');

function deleteUserAddresses(req,res,next){
    var params = req.params,result=[];
    var userId =params.userId;
    var tenant=params.tenant;
    var addresses=params.addresses;
    var authUser=params.authUser;
    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (authUser.userId !=userId ){
        return resUtil.resNoAuthorizedError(null, res, next);
    }
    if (addresses == null) {
        return next(sysError.MissingParameterError("addresses is missing", "addresses is missing"));
    }
    Seq(addresses).seqEach(function(address,i){
        var that=this;
        _deleteAddress(tenant,authUser.userId,address,true,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function _deleteAddress(tenant,userId, address, deleteUserAddress,callback){
    var addressId=address.addressId,existingAddress=null;
    if( addressId== null){
        return callback(new ReturnType(false,"addressId is missing",addressId));
    }
    var filter={tenant:tenant,addressId:addressId};
    //find this address first
    addressDAO.getAddress(filter,function(error,rows){
        if (error){
            return callback(new ReturnType(false,error.message,addressId));
        }
        if(rows.length<=0){
            return callback(new ReturnType(false,"address not found",addressId));
        }
        existingAddress=rows[0];
        //check this address belongs to this user
        if (deleteUserAddress &&  existingAddress.userId !=userId){
            return callback(new ReturnType(false,"address can not be deleted",null));
        }

        addressDAO.deleteAddress(filter,function(error,result){
            if (error) {
                logger.error(' deleterAddress ' + error.message);
                return callback(new ReturnType(false,error.message,addressId));
            } else {
                if (result.affectedRows>0) {
                    return callback(new ReturnType(true, null, addressId));
                }else{
                    return callback(new ReturnType(false, "address can not be deleted", addressId));
                }
            }
        })
    });
}

function updateUserAddresses(req,res,next){
    var params = req.params,result=[];
    var userId =params.userId;
    var tenant=params.tenant;
    var addresses=params.addresses;
    var authUser=params.authUser;
    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (authUser.userId !=userId ){
        return resUtil.resNoAuthorizedError(null, res, next);
    }
    if (addresses == null) {
        return next(sysError.MissingParameterError("addresses is missing", "addresses is missing"));
    }
    Seq(addresses).seqEach(function(address,i){
        var that=this;
        _updateAddress(tenant,authUser.userId,address, true,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}


function createUserAddresses(req,res,next){
    var params = req.params,result=[];
    var userId =params.userId;
    var tenant=params.tenant;
    var addresses=params.addresses;
    var authUser=params.authUser;
    if (tenant == null) {
        return resUtil.resTenantNotFoundError(null, res, next);
    }
    if (authUser.userId !=userId ){
        return resUtil.resNoAuthorizedError(null, res, next);
    }
    if (addresses == null) {
        return next(sysError.MissingParameterError("addresses is missing", "addresses is missing"));
    }
    Seq(addresses).seqEach(function(address,i){
        var that=this;
        address.userId=userId;
        _createAddress(tenant,authUser.userId,address,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function _updateAddress(tenant, userId,addressObj,updateUserAddress,callback){
    var addressId=addressObj.addressId,address=addressObj.address,city=addressObj.city,state=addressObj.state,zipcode=addressObj.zipcode,
        name=addressObj.name,phone=addressObj.phone,existingAddress=null;
    if (addressId==null){
        return callback(new ReturnType(false,"addressId is missing", addressId));
    }
    if (name==null){
        return callback(new ReturnType(false,"name is missing", addressId));
    }
    if (phone==null){
        return callback(new ReturnType(false,"phone is missing", addressId));
    }
    if (address==null){
        return callback(new ReturnType(false,"address is missing", addressId));
    }
    if (city==null){
        return callback(new ReturnType(false,"city is missing", addressId));
    }

    if (state==null){
        return callback(new ReturnType(false,"state is missing", addressId));
    }

    Seq().seq(function(){
        var that =this;
        addressDAO.getAddress({tenant:tenant,addressId:addressId},function(error,rows){
            if (error !=null){
                return callback(new ReturnType(false,error.message, null));
            }else {
                if (rows !=null){
                    existingAddress=rows[0];
                }
                if (existingAddress==null){
                    return callback(new ReturnType(false,"address not found", addressId));
                }
                if (updateUserAddress && existingAddress.userId !=userId){
                    return callback(new ReturnType(false,"address can not be updated", addressId));
                }
                that();
            }
        })
    }).seq(function(){
        addressDAO.updateAddress({tenant:tenant,addressId:addressId,name:name,phone:phone,address:address,city:city,state:state,
            zipcode:zipcode,updatedBy:userId},function(error,rows){
            if (error !=null){
                return callback(new ReturnType(false,error.message, addressId));
            }else{
                if (rows.affectedRows>0) {
                    return callback(new ReturnType(true, null, addressId));
                }else{
                    return callback(new ReturnType("false", "address is not updated", addressId));
                }
            }
        })
    })
}

function _createAddress(tenant, authUserId,addressObj,callback){
    var address=addressObj.address,city=addressObj.city,state=addressObj.state,zipcode=addressObj.zipcode,
        name=addressObj.name,phone=addressObj.phone,userId=addressObj.userId;
    if (name==null){
        return callback(new ReturnType(false,"name is missing", null));
    }
    if (phone==null){
        return callback(new ReturnType(false,"phone is missing", null));
    }
    if (address==null){
        return callback(new ReturnType(false,"address is missing", null));
    }
    if (city==null){
        return callback(new ReturnType(false,"city is missing", null));
    }

    if (state==null){
        return callback(new ReturnType(false,"state is missing", null));
    }
    if (zipcode==null){
        return callback(new ReturnType(false,"zipcode is missing", null));
    }

    if (userId==null){
        return callback(new ReturnType(false,"userId is missing", null));
    }
    addressDAO.addAddress({tenant:tenant,name:name,phone:phone,address:address,city:city,state:state,userId:userId,
        zipcode:zipcode,createdBy:authUserId,updatedBy:authUserId},function(error,rows){
        if (error !=null){
            return callback(new ReturnType(false,error.message, null));
        }else{
            return callback(new ReturnType(true,null, rows.insertId));
        }
    })

}

function queryUserAddresses(req,res,next){
    var params = req.params;
    var authUser=params.authUser;
    var tenant=params.tenant;
    var userId=params.userId;

    if (tenant==null){
        //to do add new error type
        return resUtil.resTenantNotFoundError(null, res, next);
    }

    if (authUser.userId !=userId ){
        return resUtil.resNoAuthorizedError(null, res, next);
    }
    addressDAO.getAddress(params ,function(error,rows){
        if(error){
            logger.error(' query ' + error.message);
            resUtil.resInternalError(error,res,next);
        }
        resUtil.resetQueryRes(res,rows);
        return next();
    });
}


function updateUserAddressesPrimaryFlag(req,res,next){
    var params = req.params;
    var authUser=params.authUser;
    var tenant=params.tenant;
    var userId=params.userId;
    var addressId=params.addressId;

    if (tenant==null){
        //to do add new error type
        return resUtil.resTenantNotFoundError(null, res, next);
    }

    if (authUser.userId !=userId ){
        return resUtil.resNoAuthorizedError(null, res, next);
    }
    addressDAO.updateAddressPrimaryFlag(params ,function(error,rows){
        if(error){
            logger.error(' query ' + error.message);
            resUtil.resInternalError(error,res,next);
        }
        return resUtil.resetSuccessRes(res,next);
    });
}

module.exports = {
    queryUserAddresses:queryUserAddresses,
    createUserAddresses:createUserAddresses,
    updateUserAddresses:updateUserAddresses,
    deleteUserAddresses:deleteUserAddresses,
    updateUserAddressesPrimaryFlag:updateUserAddressesPrimaryFlag
}