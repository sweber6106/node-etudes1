#!/usr/bin/env node

/* jshint node: true */
'use strict';

/* jshint -W074 */

//
// MongoDB/mongoose app that demonstrates complex schemas.  It also contains
// a solid version of the uncaught exception handler code.
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
var url      = require('url');
var moment   = require('moment');

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
    if (i === 0) {
      cluster.fork({ 'dbWriter' : true });
    }
    else {
      cluster.fork({ 'dbWriter' : false });
    }
  }

  cluster.on('exit', function(worker) {
    log.error('node cluster reaped worker id:', worker.id);
    console.log('node cluster reaped worker id:', worker.id);
    if (worker.suicide === true) {
      log.error('worker id:', worker.id, 'exited');
      console.log('worker id:', worker.id, 'exited');
    }
    else {
      log.error('worker id:', worker.id, 'terminated');
      console.log('worker id:', worker.id, 'terminated');
    }
    setTimeout(function() {
      cluster.fork({ 'dbWriter' : false });
    }, 3000);
  });
}

function doWorkerProcess() {
  log.info('node cluster startup worker process');
  log.info('pid', process.pid);

  async.series(
    [
      function(callback) {
        startMongoDb(callback);
      },
      function(callback) {
        defineSchema(callback);
      },
      function(callback) {
        populateCollection(callback);
      },
      function(callback) {
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

var LayeredThing;
//var LayeredThingDay;
//var LayeredThingHour;

function defineSchema(callback) {
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

  var thingSchema = new mongoose.Schema({
    name:  String, 
    taken: Number,
    days:  [daySchema],
    hours: [hourSchema]
  });

  LayeredThing = mongoose.model('LayeredThing', thingSchema);
  //LayeredThingDay = mongoose.model('LayeredThingDay', daySchema);
  //LayeredThingHour = mongoose.model('LayeredThingHour', hourSchema);

  callback(null);
}

function populateCollection(callback) {
  console.log('process.env.dbWriter:', process.env.dbWriter);

  if (process.env.dbWriter === 'false') {
    console.log('Not a dbWriter, returning');
    callback();
    return;
  }
  else {
    console.log('dbWriter, will populate database');
  }

  var thing = {};
  var i;

  thing.name = 'domainY';
  thing.taken = moment().unix();

  thing.days = [];
  for (i = 0; i < 10; ++i) {
    var day = {};
    day.goodResults = 17;
    day.fairResults = 18;
    day.poorResults = 19;

    day.durationSeconds = i * 10;
 
    thing.days.push(day); 
  }

  thing.hours = [];
  for (i = 0; i < 24; ++i) {
    var hour = {};

    hour.goodResults = 42;
    hour.fairResults = 43;
    hour.poorResults = 44;

    hour.goodMos = 7;
    hour.fairMos = 8;
    hour.poorMos = 9;

    thing.hours.push(hour);
  }

  saveLayeredThingToDb(thing, function(err) {
    if (err) {
      throw(err);
    }
    callback();
  });
}


function saveLayeredThingToDb(thing, callback) {
  LayeredThing.update({ name : thing.name }, thing, { upsert : true }, function(err) {
    if (err) {
      log.error('record save: ', err);
      console.log('record save: ', err);
    }
    else {
      console.log('database record saved');
    }
    callback();
  });
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

  var body;

  app.get(apiUrl + '/things', function(req, res) {
    var query = LayeredThing.find({});
    query.exec(function(err, results) {
      if (!err) {
        for (var i = 0; i < results.length; ++i) {
          console.log();
          console.log('name .............', results[i].name);
          console.log('taken ............', results[i].taken);
          console.log('days (length) ....', results[i].days.length);
          console.log('hours (length) ...', results[i].hours.length);
          console.log();
        }
        if (results.length) {
          body = JSON.stringify(results);
 
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(body + '\n');
        }
        else {
          console.log('no records found');
          res.writeHead(200, {'Content-Type': 'application/text'});
          res.end('no records found' + '\n');
        }
      }
      else {
        console.log('error processing collection query');
        res.writeHead(404, {'Content-Type': 'application/text'});
        res.end('collection query error' + '\n');
      };
    });
  });

  // default POST handler
  app.post('/*', function(req, res) {
    console.log('invalid resource', req.method, req.url);
    res.statusCode = 404;
    res.end('invalid POST resource\n');
  });

  // default GET handler
  app.get('/*', function(req, res) {
    console.log('invalid resource', req.method, req.url);
    res.statusCode = 404;
    res.end('invalid GET resource\n');
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
