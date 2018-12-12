// Copyright (c) 2012 Mark Cavage. All rights reserved.

var commonUtil =require('mp-common-util');
var authHeaderParser = commonUtil.authHeaderParser;
var authCheck = commonUtil.authCheck;
var restify = require('restify');
var sysConfig = require('./config/SystemConfig.js');
var serverLogger = require('./util/ServerLogger.js');
var logger = serverLogger.createLogger('Server.js');
var orderPayment = require('./bl/OrderPayment.js');
var address = require('./bl/Address.js');
var order = require('./bl/Order.js');
var listOfValue = require('./util/ListOfValue.js');
var history=require("./bl/History.js");

///--- API

/**
 * Returns a server with all routes defined on it
 */
function createServer() {
    // Create a server with our logger and custom formatter
    // Note that 'version' means all routes will default to
    // 1.0.0
    var server = restify.createServer({
        name: 'CheckOut',
        version: '1.0.0'
    });

    var authUrl=sysConfig.loginModuleUrl.protocol+"://"+sysConfig.loginModuleUrl.host+":"+sysConfig.loginModuleUrl.port+"/api/auth/tokens";
    logger.debug(authUrl);

    // Ensure we don't drop data on uploads
    //server.pre(restify.pre.pause());

    // Clean up sloppy paths like //todo//////1//
    server.pre(restify.pre.sanitizePath());

    // Handles annoying user agents (curl)
    server.pre(restify.pre.userAgentConnection());

    // Set a per request bunyan logger (with requestid filled in)
    //server.use(restify.requestLogger());

    // Allow 50 requests/second by IP, and burst to 100
    server.use(restify.throttle({
        burst: 100,
        rate: 50,
        ip: true
    }));

    restify.CORS.ALLOW_HEADERS.push('auth-token');
    restify.CORS.ALLOW_HEADERS.push('tenant');
    restify.CORS.ALLOW_HEADERS.push('client-id');
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Origin");
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Credentials");
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Methods", "GET");
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Methods", "POST");
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Methods", "PUT");
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Methods", "DELETE");
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Headers", "accept,api-version, content-length, content-md5,x-requested-with,content-type, date, request-id, response-time");
    server.use(restify.CORS());
    server.use(restify.acceptParser(server.acceptable));
    server.use(restify.dateParser());
    server.use(restify.authorizationParser());
    server.use(restify.queryParser());
    server.use(restify.gzipResponse());
    server.use(restify.fullResponse());
    server.use(restify.bodyParser({uploadDir: __dirname + '/uploads/'}));
    server.use(authHeaderParser.authHeaderParser({logger:logger,authUrl:authUrl}));

    // Now our own handlers for authentication/authorization
    // Here we only use basic auth, but really you should look
    // at https://github.com/joyent/node-http-signature

    //server.use(authenticate);

    //server.use(apiUtil.save);

    var STATICS_FILE_RE = /\.(css|js|jpe?g|png|gif|less|eot|svg|bmp|tiff|ttf|otf|woff|pdf|ico|json|wav|ogg|mp3?|xml)$/i;
    var STATICS_HTML = /\.(pdf|json|xml|html)$/i;
    server.get(STATICS_FILE_RE, restify.serveStatic({ directory: './public/web', maxAge: sysConfig.maxAge }));
    server.get(STATICS_HTML, restify.serveStatic({ directory: './public/web', maxAge: 0 }));

    server.get(/\/apidoc\/?.*/, restify.serveStatic({
        directory: './public'
    }));

    /**
     * Order module
     */
    server.post({path:'/api/users/:userId/orders',contentType: 'application/json'},authCheck.authCheck(),order.createUserOrders);
    server.put({path:'/api/users/:userId/orders',contentType: 'application/json'},authCheck.authCheck(),order.updateUserOrders);
    server.del({path:'/api/users/:userId/orders',contentType: 'application/json'},authCheck.authCheck(),order.deleteUserOrders);
    server.get('/api/users/:userId/orders',authCheck.authCheck(),order.queryUserOrders);
    server.post({path:'/api/users/:userId/orders/:orderId/status', contentType: 'application/json'},authCheck.authCheck(),
        order.updateUserOrderStatus);
    server.post({path:'/api/users/:userId/orderitems/:itemId/status', contentType: 'application/json'},authCheck.authCheck(),
        order.updateUserOrderItemStatus);

    server.get('/api/users/:userId/orderitems',authCheck.authCheck(),order.queryUserOrderItems);
    server.get('/api/biz/:bizId/orders',authCheck.authCheck(listOfValue.PERMISSION_GETBIZORDERS),order.queryBizOrders);
    server.get('/api/biz/:bizId/orderitems',authCheck.authCheck(listOfValue.PERMISSION_GETBIZORDERS),order.queryBizOrderItems);

    //server.post({path:'/api/orders',contentType: 'application/json'},authCheck.authCheck("createOrders"),order.createOrders);
    //server.put({path:'/api/orders',contentType: 'application/json'},authCheck.authCheck("updateOrders"),order.updateOrders);
    //server.del({path:'/api/orders',contentType: 'application/json'},authCheck.authCheck("deleteOrders"),order.deleteOrders);
    server.get('/api/orders',authCheck.authCheck(listOfValue.PERMISSION_GETORDERS),order.queryOrders);
    server.get('/api/orderitems',authCheck.authCheck(listOfValue.PERMISSION_GETORDERS),order.queryOrderItems);
    server.get('/api/changehistories',authCheck.authCheck(listOfValue.PERMISSION_GETCHANGEHISTORIES),history.queryChangeHisotry);
    //update order biz information
    server.post({path:'/api/orders/orderbiz',contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_UPDATEORDERS),
        order.updateOrdersBiz);
    server.post({path:'/api/orders/status', contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_UPDATEORDERS),
        order.updateOrdersStatus);
    //change order item status
    server.post({path:'/api/orderitems/status',contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_UPDATEORDERS),
        order.updateOrderItemsStatus);
    server.post({path:'/api/biz/:bizId/orders/status', contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_UPDATEBIZORDERS),
        order.updateBizOrdersStatus);
    //change order item status
    server.post({path:'/api/biz/:bizId/orderitems/status',contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_UPDATEBIZORDERS),
        order.updateBizOrderItemsStatus);
    server.get('/api/orderstatus',order.getOrderStatus);
    server.get('/api/orderItemstatus',order.getOrderItemStatus);
    //update biz order with address and note information
    server.post({path:'/api/biz/:bizId/orders/:orderId/information',contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_UPDATEBIZORDERS),
        order.updateBizOrderInformation);

    /*
    Payments module
     */
    server.get('/api/payments',authCheck.authCheck(listOfValue.PERMISSION_GETPAYMENTS),orderPayment.queryPayments);
    //server.put('/api/payments',authCheck(),order.queryOrderItem);
    server.post('/api/payments',authCheck.authCheck(listOfValue.PERMISSION_CREATEPAYMENTS),orderPayment.createPayments);
    //server.del('/api/payments',authCheck(),order.queryOrderItem);

    server.get('/api/users/:userId/addresses',authCheck.authCheck(),address.queryUserAddresses);
    server.put('/api/users/:userId/addresses',authCheck.authCheck(),address.updateUserAddresses);
    server.post('/api/users/:userId/addresses',authCheck.authCheck(),address.createUserAddresses);
    server.del('/api/users/:userId/addresses',authCheck.authCheck(),address.deleteUserAddresses);
    //set primary address
    server.post('/api/users/:userId/addresses/:addressId/primary',authCheck.authCheck(),address.updateUserAddressesPrimaryFlag);
    server.get('/api/getConnectState',orderPayment.getConnectState);
    //server.get('/api/shipAddresses',authCheck(),order.queryOrderItem);


    //server.get('/api/users/:userId/userBalances',authCheck(),order.queryOrderUserBalance);
    /*server.get('/api/orderStatus',order.getOrderStatus);*/
    //change order status


    // call tracking service?
    //server.on('after', apiUtil.save);
    return (server);
}

///--- Exports

module.exports = {
    createServer: createServer
};