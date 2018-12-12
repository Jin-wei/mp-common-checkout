/**
 * Created by ling xue on 2016/3/3.
 */

var serializer = require('serializer');
var commonUtil = require('mp-common-util');
var resUtil = commonUtil.responseUtil;


var headerTokenMeta = "auth-token";

//The expired time 30 days
var expiredTime = 30*24*60*60*1000;

function _extend(dst,src) {

    var srcs = [];
    if ( typeof(src) == 'object' ) {
        srcs.push(src);
    } else if ( typeof(src) == 'array' ) {
        for (var i = src.length - 1; i >= 0; i--) {
            srcs.push(this._extend({},src[i]))
        };
    } else {
        throw new Error("Invalid argument")
    }

    for (var i = srcs.length - 1; i >= 0; i--) {
        for (var key in srcs[i]) {
            dst[key] = srcs[i][key];
        }
    };
    return dst;
}


function createAccessToken(userId,clientType,active){
    var extraData = "";
    var out = _extend({}, {
        access_token: serializer.stringify([userId, clientType, expiredTime+(new Date().getTime()),active, extraData]),
        refresh_token: null
    });
    return out.access_token;
}

function parseAccessToken(accessToken){
    try{
        var data = serializer.parse(accessToken);
        var tokenInfo ={};
        tokenInfo.userId = data[0];
        tokenInfo.clientType = data[1];
        tokenInfo.expiredDate = data[2];
        tokenInfo.active = data[3];
        tokenInfo.extraData = data[4];
        return tokenInfo;
    }catch(e){
        return null;
    }
}

module.exports = {
    expiredTime : expiredTime ,
    headerTokenMeta : headerTokenMeta ,
    createAccessToken : createAccessToken ,
    parseAccessToken : parseAccessToken ,
}