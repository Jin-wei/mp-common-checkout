var db=require('../db/MysqlDb.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('HistoryDAO.js');

function createChangeHistory(params,callback){
    var query = " insert into change_history(tenant,item_id,item_type,change_msg,created_by,created_user)"+
        " values(?,?,?,?,?,?)";
    var paramArray=[],i=0;
    paramArray[i++]=params.tenant;
    paramArray[i++]=Number(params.itemId);
    paramArray[i++]=params.itemType;
    paramArray[i++]=params.changeMsg;
    paramArray[i++]=Number(params.createdBy);
    paramArray[i++]=params.createdUser;
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' createChangeHistory ');
        return callback(error,rows);
    });
}

function queryChangeHistory(params,callback){
    var query = " select id,item_id as itemId, item_type as itemType,change_msg as changeMsg,"+
        "created_on createdOn, created_by createdBy, created_user createdUser from change_history where tenant=? ";
    var paramArray=[],i= 0,whereclause="";
    paramArray[i++]=params.tenant;
    if(params.itemId !=null){
        paramArray[i++]=Number(params.itemId);
        whereclause= whereclause + " and item_id = ? "
    }
    if(params.itemType !=null){
        paramArray[i++]=params.itemType;
        whereclause =  whereclause + " and item_type = ? "
    }
    if(params.startDate){
        paramArray[i++] = params.startDate;
        whereclause = whereclause + " and created_on >= ? "
    }

    if (params.endDate){
        paramArray[i++] = params.endDate;
        whereclause = whereclause + " and created_on <= ? "
    }
    query = query +whereclause+" order by id desc "
    if(params.start!=null && params.size){
        query= query + " limit ? , ? "
        paramArray[i++] = Number(params.start);
        paramArray[i++] = Number(params.size);
    }
    db.dbQuery(query,paramArray,function(error,rows){
        logger.debug(' queryChangeHistory ');
        return callback(error,rows);
    });
}

module.exports = {
    createChangeHistory : createChangeHistory,
    queryChangeHistory : queryChangeHistory
}