#!/usr/bin/env node

/* jshint node: true */
'use strict';

/* jshint -W074 */

//
// Demonstrates Redis hash
//

var async    = require('async');
var cluster  = require('cluster');
var fs       = require('fs');
var mongoose = require('mongoose');
var nopt     = require('nopt');
var path     = require('path');
var config   = require('yaml-config');
var log4node = require('log4node');
var sprintf  = require('sprintf');
var https    = require('https');
var express  = require('express');
var moment   = require('moment');
var redis    = require('redis');
var url      = require('url');

var pkg = require('./package.json');

var db                    = null;
var log                   = null;
var redisClient           = null;
var configFile            = null;

var cfgClusterWorkers     = null;
var cfgMongoDbUrl         = null;
var cfgDbFindLimit        = null;
var cfgRedisHost          = null;
var cfgRedisPort          = null;
var cfgLoggerLevel        = null;
var cfgLoggerPath         = null;
var cfgListenHostname     = null;
var cfgListenPort         = null;

var cfgProxyHost          = null;
var cfgProxyPort          = null;
var cfgProxySslCert       = null;
var cfgProxySslKey        = null;

var globalDomainsCube = {};
var globalResellersCube = {};
var provisionedResellersByDomain = {};

var callInfoHash = 'callInfoHash';

var currentHour = null;
var bucketsHour = null;

function usage() {
  var exec = process.argv[0] + ' ' + path.basename(process.argv[1]);

  console.log('Usage:');
  console.log('  ' + exec + ' -c filename');
  console.log('Options:');
  console.log('  -c, --config [filename]   app configuration file');
  console.log('  -v, --version             display app version');
  console.log('  -h, --help                display app usage');
  console.log('Examples:');
  console.log('  NODE_ENV=development ' + exec + ' -c ./etc/config.yaml');
  console.log('  NODE_ENV=production ' + exec + ' -c ./etc/config.yaml');
  process.exit(0);
}

var longOptions = {
  'config'  : String,
  'version' : Boolean,
  'help'    : Boolean
};

var shortOptions = {
  'c' : ['--config'],
  'v' : ['--version'],
  'h' : ['--help']
};

var argv = nopt(longOptions, shortOptions, process.argv, 2);

if (argv.help) {
  usage();
}

if (argv.version) {
  var json = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(json.version);
  process.exit(0);
}

if (argv.config) {
  configFile = argv.config;
}
else {
  usage();
}

function loadConfig() {
  var settings = config.readConfig(configFile);

  if (Object.keys(settings).length === 0) {
    console.log('Error: readConfig:', configFile);
    process.exit(1);
  }

  function checkArg(arg, name) {
    if (typeof arg === 'undefined') {
      console.log('ERROR:', configFile + ': not found:', name);
      process.exit(1);
    }
    return arg;
  }

  cfgClusterWorkers     = checkArg(settings.cluster.workers,            'cluster.workers');
  cfgMongoDbUrl         = checkArg(settings.mongodb.url,                'mongodb.url');
  cfgDbFindLimit        = checkArg(settings.mongodb.findLimit,          'mongodb.findLimit');
  cfgRedisHost          = checkArg(settings.redis.host,                 'redis.host');
  cfgRedisPort          = checkArg(settings.redis.port,                 'redis.port');
  cfgLoggerLevel        = checkArg(settings.logger.level,               'logger.level');
  cfgLoggerPath         = checkArg(settings.logger.path,                'logger.path');
  cfgListenHostname     = checkArg(settings.server.hostname,            'server.hostname');
  cfgListenPort         = checkArg(settings.server.port,                'server.port');

  cfgProxyHost          = checkArg(settings.proxy.host,                 'proxy.host');
  cfgProxyPort          = checkArg(settings.proxy.port,                 'proxy.port');
  cfgProxySslKey        = checkArg(settings.proxy.ssl.key,              'proxy.ssl.key');
  cfgProxySslCert       = checkArg(settings.proxy.ssl.cert,             'proxy.ssl.cert');

  if (cfgClusterWorkers >= 1) {
    var workersMin = 1;
    var workersMax = 8;
    if (cfgClusterWorkers < workersMin || cfgClusterWorkers > workersMax) {
      console.log('ERROR:', configFile + ': cluster.workers =', cfgClusterWorkers, 'must be in range', workersMin + '...' + workersMax);
      process.exit(1);
    }
  }
}

function timestamp(date) {
  return sprintf.sprintf('%04u-%02u-%02u %02u:%02u:%02u',
                         date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
                         date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

function prefix() {
  return timestamp(new Date()) + ' [' + (cluster.isMaster ? 0 : cluster.worker.id) + ']';
}

function startLogger() {
  log = new log4node.Log4Node({level: cfgLoggerLevel, file: cfgLoggerPath});
  log.setPrefix(function(level) {
    return prefix() + ' ' + level.toUpperCase() + ' ';
  });
  process.on('uncaughtException', function(e) {
    logException('uncaughtException', e);
    setTimeout(function() { process.exit(1); }, 500);
  });
}

function logException(context, exception) {
  log.error(context, exception);
  if (exception !== undefined && exception.stack !== undefined) {
    var textLines = exception.stack.split('\n');
    for (var i = 0; i < textLines.length; i++) {
      log.error(i + ': ' + textLines[i].trim());
    }
  }
}

function installSignalHandlers() {
  [ 'SIGUSR1', 'SIGUSR2'
  ].forEach(function(signal) {
    process.on(signal, function() {
      log.info('received signal', signal);
    });
  });

  [ 'SIGINT'
  ].forEach(function(signal) {
    process.on(signal, function() {
      log.info('received signal', signal);
      console.log();
      process.exit(1);
    });
  });

  [ 'SIGHUP', 'SIGQUIT', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE',  'SIGSEGV', 'SIGTERM'
  ].forEach(function(signal) {
    process.on(signal, function() {
      log.error('received signal', signal);
      process.exit(1);
    });
  });

  process.on('exit', function() {
    log.info('exiting');
  });
}

(function startup() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  loadConfig();

  installSignalHandlers();

  startLogger();

  if (cluster.isMaster) {
    log.info('master process startup');
    doMasterProcess();
  }
  else {
    log.info('worker process startup');
    doWorkerProcess();
  }
}) ();

function doMasterProcess() {
  log.info(pkg.description);
  log.info(pkg.name, pkg.version);
  log.info('node cluster startup master process');
  log.info('pid', process.pid);

  async.series(
    [
      function(callback) {
        startRedis(callback);
      },
      function(callback) {
        for (var i = 0; i < cfgClusterWorkers; i++) {
          cluster.fork();
        }
        cluster.on('exit', function(worker) {
          log.error('node cluster reaped worker id:', worker.id);
          if (worker.suicide === true) {
            log.error('worker id:', worker.id, 'exited');
          }
          else {
            log.error('worker id:', worker.id, 'terminated');
          }
          setTimeout(function() {
            cluster.fork();
          }, 3000);
        });
        callback(null);
      }
    ]
  );
}

function doWorkerProcess() {
  log.info('node cluster startup worker process');
  log.info('pid', process.pid);

  async.series(
    [
      function(callback) {
        log.info('Starting Redis');
        startRedis(callback);
      },
      function(callback) {
        log.info('Starting MongoDB');
        startMongoDb(callback);
      },
      function(callback) {
        log.info('Defining schema');
        defineSchema(callback);
      },
      function(callback) {
        log.info('Starting express');
        startExpress(callback);
      }
    ],
    function(err) {
      if (err) {
        throw(err);
      }

    }
  );
}

function startRedis(callback) {
  redisClient = redis.createClient(cfgRedisPort, cfgRedisHost);

  redisClient.on('error', function(err) {
    log.error('redis error:', err);
    if (cluster.isMaster) {
      setTimeout(function() { process.exit(1); }, 250);
    }
  });

  var startup = true;
  redisClient.on('ready', function() {
    if (startup === true) {
      startup = false;
      log.info('redis ready (startup)');

      redisClient.hset(callInfoHash, "forty", "", function(err, value) {
        console.log('hset returned:', value);
      });

      redisClient.hset(callInfoHash, "two", "");
      redisClient.hset(callInfoHash, "three", "");
      redisClient.hset(callInfoHash, "four", "");
      redisClient.hset(callInfoHash, "five", "");
      redisClient.hset(callInfoHash, "six", "");
      redisClient.hset(callInfoHash, "seven", "");
      redisClient.hset(callInfoHash, "eight", "");
      redisClient.hset(callInfoHash, "nine", "");
      redisClient.hset(callInfoHash, "ten", "");
      redisClient.hset(callInfoHash, "eleven", "");
      redisClient.hset(callInfoHash, "twelve", "");
      redisClient.hset(callInfoHash, "thirteen", "");

      redisClient.hkeys(callInfoHash, function(err, replies) {
        if (err) {
          callback(err);
          return;
        }

        console.log(replies.length + " replies:");
        replies.forEach(function(reply, i) {
          console.log("    " + i + ": " + reply);
        });

        callback(null);
      });
    }
    else {
      log.info('redis ready (check)');
    }
  });
}

function startMongoDb(callback) {
  var options = {
    server:  { socketOptions: { keepalive: 1 } },
    replset: { socketOptions: { keepalive: 1 } }
  };

  log.info('db', cfgMongoDbUrl);

  var connectWithRetry = function() {
    return mongoose.connect(cfgMongoDbUrl, options, function(err) {
      if (err) {
        log.error('db error:', err);
        setTimeout(connectWithRetry, 5000);
      }
    });
  };

  db = connectWithRetry();

  db.connection.on('error', function(err) {
    log.error('db error:', err);
  });

  db.connection.on('connecting', function() {
    log.info('db connecting');
  });

  db.connection.on('connected', function() {
    log.info('db connected');
  });

  db.connection.on('open', function() {
    log.info('db opened');
    callback(null);
  });

  db.connection.on('disconnected', function() {
    log.error('db disconnected');
  });

  db.connection.on('close', function() {
    log.error('db closed');
  });

  db.connection.on('reconnected', function() {
    log.info('db reconnected');
  });

  db.connection.on('fullsetup', function() {
    log.info('db fullsetup');
  });
}

var CallDetailRecord;
var CallMetrics;
var CallMetricsDay;
var CallMetricsHour;

function defineSchema(callback) {
  var recordSchema = mongoose.Schema({
    created:         { type : Date, expires : 864000, default: Date.now },
    id:              Number,
    callId:          String,
    matchHeader:     String,
    customHeader1:   String,
    start:           Number,
    stop:            Number,
    connectDuration: Number,
    progressTime:    Number,
    caller:          String,
    callerDomain:    String,
    callerName:      String,
    called:          String,
    calledDomain:    String,
    sipResponse:     Number,
    sensorId:        Number,
    sipCallerIp:     String,
    sipCalledIp:     String,
    callerMosMin:    Number,
    calledMosMin:    Number
  });

  var daySchema = new mongoose.Schema({
    goodResults:     Number,
    fairResults:     Number,
    poorResults:     Number,
    durationSeconds: Number
  });

  var hourSchema = new mongoose.Schema({
    goodResults: Number,
    fairResults: Number,
    poorResults: Number,
    goodMos:     Number,
    fairMos:     Number,
    poorMos:     Number
  });

  var minuteSchema = new mongoose.Schema({
    goodMos: Number,
    fairMos: Number,
    poorMos: Number
  });

  var callMetricsSchema = new mongoose.Schema({
    name:         { type : String, index : true },
    type:         String,
    resellerName: String,
    taken:        Number,
    days:         [daySchema],
    hours:        [hourSchema],
    minutes:      [minuteSchema]
  });

  CallDetailRecord = mongoose.model('CallDetailRecord', recordSchema);
  CallMetrics = mongoose.model('CallMetrics', callMetricsSchema);
  CallMetricsDay = mongoose.model('CallMetricsDay', daySchema);
  CallMetricsHour = mongoose.model('CallMetricsHour', hourSchema);

  callback(null);
}

function startExpress(callback) {
  var app = express();

  app.configure('development', function() {
    log.info('configure: development');
  });

  app.configure('production', function() {
    log.info('configure: production');
  });

  app.use(express.static(__dirname + '/public'));
  app.use(express.urlencoded());
  app.use(express.json());

  /* jshint unused: false */
  app.use(function(err, req, res, next) {
    // invalid JSON in request
    log.warning(req.url);
    log.warning(err.toString());
    res.statusCode = 400; // Bad Request
    res.end(err.toString());
  });
  /* jshint unused: true */

  app.get('/esi/v1/vqda/hkeys', function(req, res) {
    redisClient.hkeys(callInfoHash, function(err, replies) {
      if (err) {
        res.statusCode = 500;
        res.end(err.toString());
      }
      else {
        var body = JSON.stringify(replies);

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(body + '\n');
      }
    });
  });

  app.get('/esi/v1/vqda/hkey/:hkey', function(req, res) {
    redisClient.hexists(callInfoHash, req.params.hkey, function(err, value) {

      res.writeHead(200, {'Content-Type': 'application/json'});

      if (value === 1) {
        res.end('value found' + '\n');
      }
      else {
        res.end('value NOT found' + '\n');
      }
    });
  });

  // default POST handler
  app.post('/*', function(req, res) {
    log.warning('invalid resource', req.method, req.url);
    res.statusCode = 404;
    res.end('invalid POST resource\n');
  });

  // default GET handler
  app.get('/*', function(req, res) {
    log.warning('invalid resource', req.method, req.url);
    res.statusCode = 404;
    res.end('invalid GET resource\n');
  });

  // attn - The fact that both of the following createServer()
  //        invocations use callback() seems wrong.

  // https
  https.createServer({
    key:  fs.readFileSync(cfgProxySslKey),
    cert: fs.readFileSync(cfgProxySslCert),
    requestCert: true,
    rejectUnauthorized: false
  }, app).listen(cfgProxyPort, cfgProxyHost, function() {
    log.info('https server started:', cfgProxyHost + ':' + cfgProxyPort);
    console.log('https server started:', cfgProxyHost + ':' + cfgProxyPort);
    callback(null);
  });

  // http
  app.listen(cfgListenPort, cfgListenHostname, function(err) {
    if (err) {
      console.log('error in app.listen()');
    }
    else {
      log.info('http server started', cfgListenHostname + ':' + cfgListenPort);
      console.log('http server started', cfgListenHostname + ':' + cfgListenPort);
    }
    callback(null);
  });
}

