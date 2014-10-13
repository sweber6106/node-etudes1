#!/usr/bin/env node

//
// console-vs-log - Test to compare console vs log performance
//
// note: up to 100,000 lines, console.log didn't falter

'use strict';

var log4node = require('log4node');
var nopt     = require('nopt');
var config   = require('yaml-config');
var cluster  = require('cluster');
var sprintf  = require('sprintf');
var fs       = require('fs');

var log              = null;
var configFile       = null;

var cfgClusterWorkers = null;
var cfgLoggerLevel    = null;
var cfgLoggerPath     = null;

console.log('Comparing console and log performance');

function usage() {
  var exec = process.argv[0] + ' ' + path.basename(process.argv[1]);

  console.log('Usage:');
  console.log('  ' + exec + ' -c filename');
  console.log('Options:');
  console.log('  -c, --config [filename]   app configuration file');
  console.log('  -v, --version             display app version');
  console.log('  -h, --help                display app usage');
  console.log('  -l, --lines               number of lines to write');
  process.exit(0);
}

var longOptions = {
  'config'  : String,
  'version' : Boolean,
  'help'    : Boolean,
  'lines'   : Number
};

var shortOptions = {
  'c' : ['--config'],
  'v' : ['--version'],
  'h' : ['--help'],
  'l' : ['--lines']
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

var lineCount;
if (argv.lines) {
  lineCount = argv.lines;
  console.log('line count from command line', lineCount);
}
else {
  lineCount = 100;
  console.log('line count set to default of 100');
}


function loadConfig() {
  var settings = config.readConfig(configFile);

  if (Object.keys(settings).length === 0) {
    console.log('ERROR: readConfig:', configFile);
    process.exit(1);
  }

  function checkArg(arg, name) {
    if (typeof arg === 'undefined') {
      console.log('ERROR:', configFile + ': not found:', name);
      process.exit(1);
    }
    return arg;
  }

  cfgClusterWorkers  = checkArg(settings.cluster.workers, 'cluster.workers');
  cfgLoggerLevel     = checkArg(settings.logger.level,    'logger.level');
  cfgLoggerPath      = checkArg(settings.logger.path,     'logger.path');

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
  process.on('uncaughtException', function(err) {
    log.error(err.message);
    setTimeout(function() { process.exit(1); }, 250);
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
      setTimeout(function() { process.exit(1); }, 250);
    });
  });

  [ 'SIGHUP', 'SIGQUIT', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE',  'SIGSEGV', 'SIGTERM'
  ].forEach(function(signal) {
    process.on(signal, function() {
      log.error('received signal', signal);
      setTimeout(function() { process.exit(1); }, 250);
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

  if (cluster.isMaster) {
    doMasterProcess();
  }

  if (cluster.isWorker) {
    doWorkerProcess();
  }
}) ();

function doMasterProcess() {
  log.info('node cluster startup master process');
  log.info('pid', process.pid);

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
}

function doWorkerProcess() {
  var filename = 'debug' + cluster.worker.id + '.txt';
  var writeStream = fs.createWriteStream(filename, { flags: 'w', encoding: null, mode: 511 });

  writeStream.on('error', function (err) {
    console.log('writeStream error:', err);
  });

  log.info('node cluster startup worker process');
  log.info('pid', process.pid);

  for (var i = 0; i < lineCount; ++i) {
    console.log(i + " ...... " + "1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890");
  }
  //writeStream.write('blah' + ';\n');
}
