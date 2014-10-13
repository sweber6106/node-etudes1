#!/usr/bin/env node

/* jshint node: true */
'use strict';

/* jshint -W074 */

//
// vqda.js
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
var request  = require('request');
var http     = require('http');
var express  = require('express');

var pkg = require('./package.json');

var db                = null;
var log               = null;
var configFile        = null;

var cfgClusterWorkers = null;
var cfgMongoDbUrl     = null;
var cfgLoggerLevel    = null;
var cfgLoggerPath     = null;
var cfgListenHostname = null;
var cfgListenPort     = null;
var cfgCookieUri      = null;

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
  configFile = './config.yaml';
  //usage();
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

  cfgClusterWorkers = checkArg(settings.cluster.workers,       'cluster.workers');
  cfgMongoDbUrl     = checkArg(settings.mongodb.url,           'mongodb.url');
  cfgLoggerLevel    = checkArg(settings.logger.level,          'logger.level');
  cfgLoggerPath     = checkArg(settings.logger.path,           'logger.path');
  cfgListenHostname = checkArg(settings.server.hostname,       'server.hostname');
  cfgListenPort     = checkArg(settings.server.port,           'server.port');
  cfgCookieUri      = checkArg(settings.voipmonitor.cookieUri, 'voipmonitor.cookieUri');

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
  //return timestamp(new Date()) + ' [0]';
}

function startLogger() {
  log = new log4node.Log4Node({level: cfgLoggerLevel, file: cfgLoggerPath});
  log.setPrefix(function(level) {
    return prefix() + ' ' + level.toUpperCase() + ' ';
  });
  process.on('uncaughtException', function(err) {
    log.error(err.message);
    process.exit(1);
  });
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
  loadConfig();

  installSignalHandlers();

  startLogger();

  if (cfgClusterWorkers >= 1) {
    if (cluster.isMaster) {
      console.log('master process startup');
      doMasterProcess();
    }
    else {
      console.log('worker process startup');
      doWorkerProcess();
    }
  }
  else {
    console.log('worker process startup (no clustering)');
    doWorkerProcess();
  }
}) ();

function doMasterProcess() {
  log.info(pkg.description);
  log.info(pkg.name, pkg.version);
  log.info('node cluster startup master process');
  log.info('pid', process.pid);

  for (var i = 0; i < cfgClusterWorkers; ++i) {
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
}

function doWorkerProcess() {
  log.info('node cluster startup worker process');
  log.info('pid', process.pid);

  async.series(
    [
      function(callback) {
        startupMongoDb(callback);
      },
      function(callback) {
        defineSchema(callback);
      },
      function(callback) {
        startExpress(callback);
      }
    ]
  );
}

function startupMongoDb(callback) {
  var options = {
    server:  { socketOptions: { keepalive: 1 } },
    replset: { socketOptionsr:{ keepalive: 1 } }
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

function defineSchema(callback) {
  var recordSchema = mongoose.Schema({
    start: {
      date:          String,
      time:          String
    },
    stop: {
      date:          String,
      time:          String
    },
    duration:        String,
    caller:          String,
    callerDomain:    String,
    called:          String,
    calledDomain:    String,
    lastSipResponse: String,
    sensorId:        String,
    callerUserAgent: String,
    calledUserAgent: String,
    sipCallId:       String,
    callerMosF1:     String,
    callerMosF2:     String,
    callerMosAdapt:  String,
    calledMosF1:     String,
    calledMosF2:     String,
    calledMosAdapt:  String,
    mosMin:          String,
    callerMosMin:    String,
    calledMosMin:    String
  });

  CallDetailRecord = mongoose.model('CallDetailRecord', recordSchema);
  callback(null);
}


// Operation we're trying to perform:
// # wget -q -O - '192.168.76.201/voipmonitor/php/model/sql.php?module=bypass_login&user=voipmonitor&pass=voipmonitor'
//
// Form of the response
// {"SID":"b91f21229045a11590883239604d790d","success":true,"_vm_version":"1301"}

function getCookie(callback) {
  request.post(
    { uri: cfgCookieUri, strictSSL: false },
    function(err, response) {
      if (err) {
        console.log('request.post', err);
        callback(err);
      }
      if (response.statusCode !== 200) {
        console.log(cfgCookieUri, response.statusCode, http.STATUS_CODES[response.statusCode]);
        callback({ error: response.statusCode, message: http.STATUS_CODES[response.statusCode] });
      }
      else {
        //console.dir(response);

        //console.dir(response.body);

        try {
          var jsonData = JSON.parse(response.body);
          //console.log('SID:', jsonData.SID);
          callback(null, jsonData.SID);
        }
        catch(err) {
          console.log('Response body is not valid JSON');
          console.log('Response body', response.body);
          callback(err);
        }
      }
    }
  );
}

function getRequestedCdrs(callback, sid) {
  console.log('SID:', sid);
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

  var apiVersion = 'v1';

  var apiUrl = '/api/' + apiVersion;

  app.get(apiUrl + '/:domain/:user', function(req, res) {
    console.log('domain:' + req.params.domain + '  user:' + req.params.user);

    async.waterfall(
      [
        function(callback2) {
          getCookie(callback2);
        },
        function(sid, callback2) {
          getRequestedCdrs(callback2, sid);
        }
      ],
      function(err) {
        if (err) {
          console.log('error in VoIPmonitor section' + err);
          res.statusCode = 404;
        }
        else {
          res.statusCode = 200;
        }
        res.end();
      }
    );
  });

  app.listen(cfgListenPort, cfgListenHostname, function(err) {
    if (err) {
      console.log('error in app.listen()');
    }
    else {
      console.log('server started', cfgListenHostname + ':' + cfgListenPort);
    }
    callback(null);
  });
}
