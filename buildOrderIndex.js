var searchOrder=require('./bl/Search.js');
var Seq = require('seq');
var sysConfig = require('./config/SystemConfig.js');
//commond line tool to build product index
(function main() {
    var tenants=sysConfig.indexOrderTenants;
    Seq(tenants).seqEach(function(tenant,i){
        var that=this;
        searchOrder.doBuildOrderIndex(tenants[i], function (error) {
            if (error) {
                console.log(tenants[i]+ "index order failed:" + error.message);
            } else {
                console.log(tenants[i] +"index order succeed");
            }
            searchOrder.doBuildOrderItemIndex(tenants[i], function (error) {
                if (error) {
                    console.log(tenants[i]+ "index order item failed:" + error.message);
                    that(null,i);
                } else {
                    console.log(tenants[i] +"index order item succeed");
                    that(null,i);
                }
            });
        });
    }).seq(function(){
        process.exit(0);
    })
})();