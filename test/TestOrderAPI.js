var assert = require("assert");
var request1= require('supertest');
var sysConfig=require("../config/SystemConfig.js");


exports.test=function(request){describe('service: order', function() {
    var token;
    var host="localhost";
    var port=8091;
    before(function(done){
        var user = {phone: "123456789000", password: "1234567"};
        //use supertest to test post form data
        request1('http://'+host+':'+port).post("/api/login").set('Content-Type', 'application/json').set("tenant","0000000000").set('Accept', 'application/json').send(user).end(function (err, res) {
            if (err) {
                done(err);
            }
            console.dir(res.body.result);
            assert(res.body.success == true);
            token = res.body.result.accessToken;
            console.log("token==============:" + token);
            done();

        })

    });
   describe('Test create a order', function() {
        var host="localhost";
        var port=8091;
        it('should create an order', function(done) {
            var token;
            var user = {phone: "123456789000", password: "1234567"};
            var item  =[];
            var userId=1;
            var bizId=1;
            var amount=100;
            var quantity=10;
            var productId=1;



            item[0]={};
            item[0].unitPrice=10;
            item[0].quantity=10;
            item[0].productId=1;
            item[0].amount=10;
            item[0].productName="abc";

            item[1]={};
            item[1].unitPrice=10;
            item[1].quantity=10;
            item[1].productId=1;
            item[1].amount=10;
            item[1].productName="bcd";
            var order={userId:userId,bizId:bizId,orderAmount:amount,orderQuantity:quantity,items:item};
            console.log('http://'+host+':'+port);

            request1('http://'+host+':'+port).post("/api/login").set("tenant","0000000000").set('Content-Type', 'application/json').set('Accept', 'application/json').send(user).end(function (err, res) {
                if (err) {
                    done(err);
                }
                assert(res.body.success==true);
                token = res.body.result.accessToken;
                console.log("token==============:"+token);
                request.post('/api/user/'+userId+'/order').set('auth-token',token).set("tenant","0000000000").set('Accept', 'application/json')
                    .set('Content-Type', 'application/json')
                    .send(order)
                    .end(function(err,res){
                        if (err) {
                            done(err);
                        }
                        else {
                            console.dir(res.statusCode);
                            console.dir(res.body);
                            assert(res.body.success==true);
                            assert(res.body.id>0);
                            done();
                        }
                    });
            })
        });
    });

    describe('Test query user orders', function() {

        it('should get an order', function(done) {
            //sysConfig.checkAuth=false;
            var userId=1;

            request.get('/api/user/'+userId+'/order').set('Accept', 'application/json').set('auth-token',token).set("tenant","0000000000")
                .expect(200).end(function(err,res){
                    if (err) {
                        return done(err);
                    }
                    else {
                        assert(res.body.success==true);
                        assert(res.body.result.length>=1);
                        done();
                    }
                });
        });
    });

    describe('Test query user orders with paging', function() {

        it('should get an order', function(done) {
            //sysConfig.checkAuth=false;
            var userId=1;

            request.get('/api/user/'+userId+'/order?start=0&size=5').set('Accept', 'application/json').set('auth-token',token).set("tenant","0000000000")
                .expect(200).end(function(err,res){
                    if (err) {
                        return done(err);
                    }
                    else {
                        assert(res.body.success==true);
                        console.log(res.body.result.length);
                        assert(res.body.result.length==5);
                        done();
                    }
                });
        });
    });

    describe('Test query user orders with start end', function() {

        it('should get an order', function(done) {
            //sysConfig.checkAuth=false;
            var userId=1;

            request.get('/api/user/'+userId+'/order?startDate=2016-03-15&endDate=2016-03-16').set('Accept', 'application/json').set('auth-token',token).set("tenant","0000000000")
                .expect(200).end(function(err,res){
                    if (err) {
                        return done(err);
                    }
                    else {
                        assert(res.body.success==true);
                        console.log(res.body.result.length);
                        assert(res.body.result.length>0);
                        done();
                    }
                });
        });
    });

    describe('Test query user orders items with paging', function() {

        it('should get an order', function(done) {
            //sysConfig.checkAuth=false;
            var userId=1;

            request.get('/api/user/'+userId+'/orderItem?start=0&size=5').set('Accept', 'application/json').set('auth-token',token).set("tenant","0000000000")
                .expect(200).end(function(err,res){
                    if (err) {
                        return done(err);
                    }
                    else {
                        assert(res.body.success==true);
                        console.log(res.body.result.length);
                        assert(res.body.result.length==5);
                        done();
                    }
                });
        });
    });

    describe('Test query user order item with start end', function() {

        it('should get an order', function(done) {
            //sysConfig.checkAuth=false;
            var userId=1;

            request.get('/api/user/'+userId+'/orderItem?startDate=2016-03-15&endDate=2016-03-16').set('Accept', 'application/json').set('auth-token',token).set("tenant","0000000000")
                .expect(200).end(function(err,res){
                    if (err) {
                        return done(err);
                    }
                    else {
                        assert(res.body.success==true);
                        console.log(res.body.result.length);
                        assert(res.body.result.length>0);
                        done();
                    }
                });
        });
    });


     describe('Test query a user order by id', function() {
         sysConfig.checkAuth=false;
         it('should get an order', function(done) {
             var userId=1;
             var orderId=1;

             request.get('/api/user/'+userId+'/order/'+orderId).set('Accept', 'application/json').set('auth-token',token).set("tenant","0000000000")
                 .expect(200).end(function(err,res){
                     if (err) {
                         return done(err);
                     }
                     else {
                         assert(res.body.success==true);
                         assert(res.body.result.length==1);
                         done();
                     }
                 });
         });
     });

     describe('Test query user all order items', function() {
         sysConfig.checkAuth=false;
         it('should get an order items', function(done) {
             var userId=1;
             var orderId=2;

             request.get('/api/user/'+userId+'/orderItem').set('Accept', 'application/json').set('auth-token',token).set("tenant","0000000000")
                 .expect(200).end(function(err,res){
                     if (err) {
                         return done(err);
                     }
                     else {
                         assert(res.body.success==true);
                         assert(res.body.result.length>=1);
                         done();
                     }
                 });
         });
     });

     describe('Test query a order item', function() {
         sysConfig.checkAuth=false;
         it('should get an order items', function(done) {
             var userId=1;
             var orderId=2;

             request.get('/api/user/'+userId+'/order/'+orderId+'/orderItem').set('Accept', 'application/json').set('auth-token',token).set("tenant","0000000000")
                 .expect(200).end(function(err,res){
                     if (err) {
                         return done(err);
                     }
                     else {
                         assert(res.body.success==true);
                         assert(res.body.result.length>=1);
                         done();
                     }
                 });
         });
     });
     describe('Test query a user balance', function() {
         sysConfig.checkAuth=false;
         it('should get a user balance', function(done) {
             var userId=1;

             request.get('/api/user/'+userId+'/userBalance').set('Accept', 'application/json').set('auth-token',token).set("tenant","0000000000")
                 .expect(200).end(function(err,res){
                     if (err) {
                         return done(err);
                     }
                     else {
                         //console.dir(res.body)
                         assert(res.body.success==true);
                         assert(res.body.result.amount>0);
                         done();
                     }
                 });
         });
     });
});
}