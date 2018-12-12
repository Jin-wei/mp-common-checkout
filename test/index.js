var restify = require('restify');
var request= require('supertest');
var sysConfig=require("../config/SystemConfig.js");
// init the test client

//Customer 2
/*var client = restify.createJsonClient({
 version: '*',
 url: 'http://127.0.0.1:8080',
 headers : {'auth-token':'Ds3JkGe-w_nYbWgbw9wXMjsBZyA=RZ9tM0QBb23c939abd2d633e9b0f0126da548ba7671c3a1c265f648b91c01f02f14bc2933a90ceeb619377f1ee47fc35c5e2eaec'}

 });*/

//Buisness 103072
/*var client = restify.createJsonClient({
 version: '*',
 url: 'http://127.0.0.1:8080',
 headers : {'auth-token':'27k79pC9CLcfgN0NSBiXvuECmro=QZnASPa860ef35206014780c125268626d09ad2fc237af6720d72ee41a6ed7b60396b6d7f2239be2dfef72b056d10237ed5368f2'}

 });*/

//use supertest to test post form data
request=request('http://127.0.0.1:8080');
var orderTest = require('./TestOrderAPI')

orderTest.test(request);




//var bizTest = require('./biz.test').test(client);
//var custTest = require('./cust.test').test(client);
//var prodTest = require('./prod.test').test(client,request);
//var promoTest = require('./promo.test').test(client);
//var couponTest = require('./coupon.test').test(client,request);
//var pointTest = require('./point.test').test(client,request);
//var mailTest = require('./mail.test').test(client,request);
//searchTest = require('./search.test').test(client);
//var utilTest = require('./util.test').test(client);
//var imgTest = require('./img.test').test(client);
//var orderTest = require('./order.test').test(client);
//var tableTest = require('./table.test').test(client);
//var roleBaseTest = require('./roleBase.test').test(client);
//var paymentTest = require('./payment.test').test(client);
//var siteMapTest = require('./sitemap.test').test(client);
//var iosPushTest = require('./iospush.test').test(client);


