var sysConfig = require('../config/SystemConfig.js');

var Alipay = require('alipay').Alipay;

exports.alipay = new Alipay(sysConfig.alipayConfig);
