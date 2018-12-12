var getopt = require('posix-getopt');
var restify = require('restify');

var mg = require('./server.js');

var sysConfig = require('./config/SystemConfig.js');
var serverLogger = require('./util/ServerLogger.js');
var logger = serverLogger.createLogger('main.js');


///--- Globals

var NAME = 'mg';

// In true UNIX fashion, debug messages go to stderr, and audit records go

function parseOptions() {
    var option;
    var opts = {}
    var parser = new getopt.BasicParser(':h:p:(port)', process.argv);

    while ((option = parser.getopt()) !== undefined) {
        switch (option.option) {
            case 'p':
                opts.port = parseInt(option.optarg, 10);
                break;
            case 'h':
                usage();
                break;

            default:
                usage('invalid option: ' + option.option);
                break;
        }
    }

    return (opts);
}


function usage(msg) {
    if (msg)
        console.error(msg);

    var str = 'usage: ' +
        NAME +
        '[-p port] [-h]';
    console.error(str);
    process.exit(msg ? 1 : 0);
}


(function main() {
    var opt=parseOptions();
    var server = mg.createServer();
    // At last, let's rock and roll
    /*smsUtil.getAccountInfo({},function(error,result){
        if(error){
            logger.error("err" + error.message)
        }else{
            console.log(result);
        }
    });*/

    server.listen((opt.port?opt.port:8080), function onListening() {
        server.get('/',restify.serveStatic({
            directory: './public/web',
            default: sysConfig.mainPage,
            maxAge: 0
        }));
        logger.info('Common checkout has been  started ,listening at %s', server.url);
    });

})();