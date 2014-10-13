#!/usr/bin/env node

/* jshint node: true */
'use strict';

/* jshint -W074 */

//
// App that demonstrates formatted output.
//

var async    = require('async');
var cluster  = require('cluster');
var fs       = require('fs');
var nopt     = require('nopt');
var path     = require('path');
var config   = require('yaml-config');
var log4node = require('log4node');
var sprintf  = require('sprintf');
var http     = require('http');
var url      = require('url');

var log               = null;
var configFile        = null;

var cfgClusterWorkers = null;
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

  console.log('This is a test of %s.', 'splat');
  log.info('This is a formatted log %s.', 'message');

  console.log("User %s has %d points", 'sweber', 1024);
}
