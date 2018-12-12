/**
 * Created by ling xue  on 15-8-28.
 */

var mysqlConnectOptions ={
    user: '@@mysqlUser',
    password: '@@mysqlPass',
    database:'@@mysqlDB',
    host: '@@mysqlHost' ,
    charset : 'utf8mb4'
    //,dateStrings : 'DATETIME'
};

var loggerConfig = {
    level : '@@logLevel',
    config : {
        appenders: [
            { type: 'console' },
            {
                "type": "file",
                "filename": "@@logFileFullName",
                "maxLogSize": @@logMaxSize,
            "backups": @@logBackups
}
]
}
};

var elasticSearchOption ={
    host: '@@elasticUrl',
    log: '@@elasticLogLevel'
};

function getElasticSearchOption(){
    return elasticSearchOption;
}

var loginModuleUrl = {protocol:"@@loginModuleProtocol",host:"@@loginModuleHost", port:@@loginModulePort};

function getMysqlConnectOptions (){
    return mysqlConnectOptions;
}

var indexOrderTenants=@@indexOrderTenants;

var maxAge=@@maxAge;

module.exports = {
    getMysqlConnectOptions : getMysqlConnectOptions,
    loggerConfig : loggerConfig,
    loginModuleUrl:loginModuleUrl,
    getElasticSearchOption:getElasticSearchOption,
    indexOrderTenants:indexOrderTenants,
    maxAge:maxAge
}
