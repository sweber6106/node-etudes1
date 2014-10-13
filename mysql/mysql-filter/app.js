#!/usr/bin/env node

//
// mysql-filter - Reads a VoIPmonitor MySQL database, filters it, and creates a new database.
//

'use strict';

var fs       = require('fs');
var async    = require('async');
var log4node = require('log4node');
var sprintf  = require('sprintf');
var nopt     = require('nopt');
var config   = require('yaml-config');
var cluster  = require('cluster');
var path     = require('path');
var mysql    = require('mysql');
var moment   = require('moment');
var http     = require('http');
var S        = require('string');

var pkg = require('./package.json');

var log           = null;
var configFile    = null;
var dbConnection  = null;
var dbConnection2 = null;

var cfgClusterWorkers    = null;
var cfgLoggerLevel       = null;
var cfgLoggerPath        = null;
var cfgDbUser            = null;
var cfgDbPassword        = null;
var cfgDbHost            = null;
var cfgDbSrcName         = null;
var cfgDbDestName        = null;
var cfgRecordsPerChunk   = null;
var cfgDesiredRecords    = null;

var domains = fs.readFileSync('./domains.txt', 'utf8');
var domainList = domains.split('\n');

function usage() {
  var exec = process.argv[0] + ' ' + path.basename(process.argv[1]);

  console.log('Usage:');
  console.log('  ' + exec + ' -c filename');
  console.log('Options:');
  console.log('  -c, --config [filename]   app configuration file');
// attn - trace?
  console.log('  -t, --trace               development only');
  console.log('  -v, --version             display app version');
  console.log('  -h, --help                display app usage');
  console.log('Examples:');
  console.log('  NODE_ENV=development ' + exec + ' -c ./etc/config.yaml');
  console.log('  NODE_ENV=production ' + exec + ' -c ./etc/config.yaml');
  process.exit(0);
}

var longOptions = {
  'config'  : String,
  'trace'   : Boolean,
  'version' : Boolean,
  'help'    : Boolean
};

var shortOptions = {
  'c' : ['--config'],
  't' : ['--trace'],
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

  cfgClusterWorkers    = checkArg(settings.cluster.workers,       'cluster.workers');
  cfgDbUser            = checkArg(settings.mysql.user,            'mysql.user');
  cfgDbPassword        = checkArg(settings.mysql.password,        'mysql.password');
  cfgDbHost            = checkArg(settings.mysql.host,            'mysql.host');
  cfgDbSrcName         = checkArg(settings.mysql.srcdb,           'mysql.srcdb');
  cfgDbDestName        = checkArg(settings.mysql.destdb,          'mysql.destdb');
  cfgLoggerLevel       = checkArg(settings.logger.level,          'logger.level');
  cfgLoggerPath        = checkArg(settings.logger.path,           'logger.path');
  cfgRecordsPerChunk   = checkArg(settings.recordsPerChunk,       'recordsPerChunk');
  cfgDesiredRecords    = checkArg(settings.desiredRecords,        'desiredRecords');

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
      if (dbConnection !== null) {
        dbConnection.end(function(err) {
          if (err) {
            log.error('error terminating dbConnection:', err);
          }
        });
      }
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
  log.info(pkg.description);
  log.info(pkg.name, pkg.version);
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

function filter() {
  var idArray = [];
  var dbQuery;

  var startTime = moment();

  var bDone = false;
  var highestId = 0;
  var currentId;

  var passCount = 0;
  var highestCallEnd = 0;
  var currentCallEnd = 0;

  async.doUntil(
    function(callbackUntil) {
      async.series(
        [
          function(callback) {
            while (idArray.length > 0) {
              idArray.pop();
            }

            dbQuery = 'SELECT * FROM cdr WHERE ID > ' + highestId + ' LIMIT ' + cfgRecordsPerChunk;
            /* jshint unused: false */
            dbConnection.query(dbQuery, function(err, rows, fields) {
            /* jshint unused: false */
              if (err) {
                log.error('error SELECTING unprocessed records:', err);
                callback(err);
                return;
              }

              if ((rows.length < cfgRecordsPerChunk) || (passCount >= cfgDesiredRecords)) {
                bDone = true;
              }

              // testing only
              console.log();
              console.log('records ........', rows.length);
              console.log('highestId ......', highestId);
              console.log('passed .........', passCount);
              console.log();

              async.eachSeries(rows, function(row, arrayCallback) {
                /* jshint camelcase: false */
                currentId = row.ID;

                //console.log('current .....', currentId);
                //console.log('highestId ...', highestId);

                if (currentId > highestId) {
                  highestId = currentId;
                }

                console.log(row.callend);
                // Thu May 08 2014 04:47:59 GMT-0500 (CDT)
                var input = String(row.callend);
                var index = input.indexOf(' ');
                input = input.slice(index);
                currentCallEnd = moment(input, 'MMM DD YYYY HH:mm:ss Z').unix();

                if (currentCallEnd > highestCallEnd) {
                  highestCallEnd = currentCallEnd;
                }

                if ((domainList.indexOf(row.caller_domain) !== -1) || (domainList.indexOf(row.called_domain) !== -1)) {
                  idArray.push(currentId);

                  passCount +=1;

                  //console.log(JSON.stringify(row));

                  var anotherArray = JSON.stringify(row);
                  anotherArray = anotherArray.substring(1, anotherArray.length - 1);
                  var tokensArray = anotherArray.split(',');
                  var values = '';
         
                  async.eachSeries(tokensArray, function(element, keyArrayCallback) {
                    if (values.length !== 0) {
                      values += ',';
                    }
                    var firstColon = element.indexOf(':');
                    var temp = element.substring(firstColon + 1);

                    values += temp;
                    keyArrayCallback();
                  },
                  function(err) { 
                    //console.log(values);

                    // write the row to the filtered table
                    dbQuery = 'INSERT INTO cdr VALUES (' + values + ')';

                    //console.log(dbQuery);

                    dbConnection2.query(dbQuery, function(err, rows, fields) {
                      if (err) {
                        log.error('inserting into filtered cdr');
                        arrayCallback(err);
                      }
                      else {
                        arrayCallback();
                      }
                    });
                  });
                }
                else {
                  arrayCallback();
                }
              },
              function(err) {
                if (err) {
                  log.error('async.eachSeries error:', err);
                  callback(err);
                }
                else {
                  callback();
                }
              });
            });
          },
          function(callback) {
            if (idArray.length === 0) {
              callback();
              return;
            }
            dbQuery = 'SELECT * FROM cdr_next WHERE cdr_ID IN (' + idArray + ');';
            /* jshint unused: false */
            dbConnection.query(dbQuery, function(err, rows, fields) {
              if (err) {
                log.error('SELECTING cdr_next error:', err);
                callback(err);
              }
              else {
                async.eachSeries(rows, function(row, arrayCallback) {
                  var anotherArray2 = JSON.stringify(row);
                  anotherArray2 = anotherArray2.substring(1, anotherArray2.length - 1);
                  var tokensArray2 = anotherArray2.split(',');
                  var values2 = '';
         
                  async.eachSeries(tokensArray2, function(element, keyArrayCallback) {
                    if (values2.length !== 0) {
                      values2 += ',';
                    }
                    var firstColon2 = element.indexOf(':');
                    var temp2 = element.substring(firstColon2 + 1);

                    values2 += temp2;
                    keyArrayCallback();
                  },
                  function(err) { 
                    //console.log(values);

                    // write the row to the filtered table
                    dbQuery = 'INSERT INTO cdr_next VALUES (' + values2 + ')';

                    //console.log(dbQuery);

                    dbConnection2.query(dbQuery, function(err, rows, fields) {
                      if (err) {
                        arrayCallback(err);
                      }
                      else {
                        arrayCallback();
                      }
                    });
                  });
                },
                function(err) {
                  if (err) {
                    log.error('async.eachSeries error:', err);
                    callback(err);
                  }
                  else {
                    callback();
                  }
                });
              }
            });
            /* jshint unused: true */
          },
          function(callback) {
            callback();
          },
        ],
        function(err) {
          if (err) {
            log.error('Iteration series wrap-up error:', err);
            callbackUntil(err);
          }
          else {
            callbackUntil();
          }
        }
      );
    },
    function() {
      return bDone;
    },
    function(err) {
      if (err) {
        log.error('until wrap-up function error:', err);
      }
      log.info('total records ..........', passCount);

      console.log();
      console.log('total records ..........', passCount);
      console.log('highest call end .......', highestCallEnd);
      console.log();
    }
  );
}
 
function doWorkerProcess() {
  log.info('node cluster startup worker process');
  log.info('pid', process.pid);

  dbConnection = mysql.createConnection({
    host     : cfgDbHost,
    user     : cfgDbUser,
    password : cfgDbPassword,
    database : cfgDbSrcName
  });

  dbConnection.connect(function(err) {
    if (err) {
      log.error('dbConnection error:', err.stack);
      return;
    }
    log.info('dbConnection id:', dbConnection.threadId);
  });

  dbConnection2 = mysql.createConnection({
    host     : cfgDbHost,
    user     : cfgDbUser,
    password : cfgDbPassword,
    database : cfgDbDestName
  });

  var dbQuery;

  async.series(
    [
      function(callback) {
        dbConnection2.connect(function(err) {
          if (err) {
            log.error('dbConnection2:', err.stack);
            callback(err);
          }
          else {
            log.info('dbConnection2 id:', dbConnection2.threadId);
            callback(err);
          }
        });
      },
      function(callback) {
        dbQuery = 'DROP TABLE IF EXISTS cdr';

        dbConnection2.query(dbQuery, function(err, rows, fields) {
          if (err) {
            log.error('dbConnection2 dropping cdr table');
            console.log('Failed to drop cdr table');
            callback(err);
          }
          else {
            callback();
          }
        });
      },
      function(callback) {
        dbQuery = 'DROP TABLE IF EXISTS cdr_next';

        dbConnection2.query(dbQuery, function(err, rows, fields) {
          if (err) {
            log.error('dbConnection2 dropping cdr_next table');
            console.log('Failed to drop cdr_next table');
            callback(err);
          }
          else {
            callback();
          }
        });
      },
      function(callback) {
        dbQuery = 'CREATE TABLE IF NOT EXISTS `cdr_next` (' +
                                                          '`cdr_ID` int(10) unsigned NOT NULL,' +
                                                          '`calldate` datetime NOT NULL,' +
                                                          '`custom_header1` varchar(255) DEFAULT NULL,' +
                                                          '`fbasename` varchar(255) DEFAULT NULL,' +
                                                          '`match_header` varchar(128) DEFAULT NULL,' +
                                                          '`GeoPosition` varchar(255) DEFAULT NULL,' +
                                                          '`processed` tinyint(1) DEFAULT \'0\',' +
                                                          'PRIMARY KEY (`cdr_ID`,`calldate`),' +
                                                          'KEY `fbasename` (`fbasename`),' +
                                                          'KEY `processed_index` (`processed`)' +
                                                          ') ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=COMPRESSED';
    
        dbConnection2.query(dbQuery, function(err, rows, fields) {
          if (err) {
            log.error('dbConnection2 creating cdr_next');
            console.log('Failed to create cdr_next table');
            callback(err);
          }
          else {
            callback();
          }
        });
      },
      function(callback) {
        dbQuery = 'CREATE TABLE IF NOT EXISTS `cdr` (' +
                                                     '`ID` int(10) unsigned NOT NULL AUTO_INCREMENT,' +
                                                     '`calldate` datetime NOT NULL,' +
                                                     '`callend` datetime NOT NULL,' +
                                                     '`duration` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`connect_duration` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`progress_time` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`first_rtp_time` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`caller` varchar(255) DEFAULT NULL,' +
                                                     '`caller_domain` varchar(255) DEFAULT NULL,' +
                                                     '`caller_reverse` varchar(255) DEFAULT NULL,' +
                                                     '`callername` varchar(255) DEFAULT NULL,' +
                                                     '`callername_reverse` varchar(255) DEFAULT NULL,' +
                                                     '`called` varchar(255) DEFAULT NULL,' +
                                                     '`called_domain` varchar(255) DEFAULT NULL,' +
                                                     '`called_reverse` varchar(255) DEFAULT NULL,' +
                                                     '`sipcallerip` int(10) unsigned DEFAULT NULL,' +
                                                     '`sipcallerport` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`sipcalledip` int(10) unsigned DEFAULT NULL,' +
                                                     '`sipcalledport` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`whohanged` enum(\'caller\',\'callee\') DEFAULT NULL,' +
                                                     '`bye` tinyint(3) unsigned DEFAULT NULL,' +
                                                     '`lastSIPresponse_id` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`lastSIPresponseNum` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`sighup` tinyint(4) DEFAULT NULL,' +
                                                     '`dscp` int(10) unsigned DEFAULT NULL,' +
                                                     '`a_index` tinyint(4) DEFAULT NULL,' +
                                                     '`b_index` tinyint(4) DEFAULT NULL,' +
                                                     '`a_payload` int(11) DEFAULT NULL,' +
                                                     '`b_payload` int(11) DEFAULT NULL,' +
                                                     '`a_saddr` int(10) unsigned DEFAULT NULL,' +
                                                     '`b_saddr` int(10) unsigned DEFAULT NULL,' +
                                                     '`a_received` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_received` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_lost` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_lost` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_ua_id` int(10) unsigned DEFAULT NULL,' +
                                                     '`b_ua_id` int(10) unsigned DEFAULT NULL,' +
                                                     '`a_avgjitter_mult10` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_avgjitter_mult10` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_maxjitter` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`b_maxjitter` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`a_sl1` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_sl2` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_sl3` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_sl4` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_sl5` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_sl6` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_sl7` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_sl8` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_sl9` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_sl10` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_d50` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_d70` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_d90` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_d120` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_d150` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_d200` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_d300` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_sl1` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_sl2` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_sl3` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_sl4` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_sl5` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_sl6` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_sl7` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_sl8` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_sl9` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_sl10` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_d50` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_d70` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_d90` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_d120` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_d150` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_d200` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_d300` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_mos_lqo_mult10` tinyint(3) unsigned DEFAULT NULL,' +
                                                     '`b_mos_lqo_mult10` tinyint(3) unsigned DEFAULT NULL,' +
                                                     '`a_mos_f1_mult10` tinyint(3) unsigned DEFAULT NULL,' +
                                                     '`a_mos_f2_mult10` tinyint(3) unsigned DEFAULT NULL,' +
                                                     '`a_mos_adapt_mult10` tinyint(3) unsigned DEFAULT NULL,' +
                                                     '`b_mos_f1_mult10` tinyint(3) unsigned DEFAULT NULL,' +
                                                     '`b_mos_f2_mult10` tinyint(3) unsigned DEFAULT NULL,' +
                                                     '`b_mos_adapt_mult10` tinyint(3) unsigned DEFAULT NULL,' +
                                                     '`a_rtcp_loss` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`a_rtcp_maxfr` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`a_rtcp_avgfr_mult10` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`a_rtcp_maxjitter` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`a_rtcp_avgjitter_mult10` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`b_rtcp_loss` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`b_rtcp_maxfr` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`b_rtcp_avgfr_mult10` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`b_rtcp_maxjitter` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`b_rtcp_avgjitter_mult10` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`a_last_rtp_from_end` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`b_last_rtp_from_end` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`payload` int(11) DEFAULT NULL,' +
                                                     '`jitter_mult10` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`mos_min_mult10` tinyint(3) unsigned DEFAULT NULL,' +
                                                     '`a_mos_min_mult10` tinyint(3) unsigned DEFAULT NULL,' +
                                                     '`b_mos_min_mult10` tinyint(3) unsigned DEFAULT NULL,' +
                                                     '`packet_loss_perc_mult1000` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_packet_loss_perc_mult1000` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_packet_loss_perc_mult1000` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`delay_sum` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_delay_sum` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_delay_sum` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`delay_avg_mult100` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_delay_avg_mult100` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_delay_avg_mult100` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`delay_cnt` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`a_delay_cnt` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`b_delay_cnt` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`rtcp_avgfr_mult10` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`rtcp_avgjitter_mult10` smallint(5) unsigned DEFAULT NULL,' +
                                                     '`lost` mediumint(8) unsigned DEFAULT NULL,' +
                                                     '`id_sensor` smallint(5) unsigned DEFAULT NULL,' +
                                                     'PRIMARY KEY (`ID`,`calldate`),' +
                                                     'KEY `calldate` (`calldate`),' +
                                                     'KEY `callend` (`callend`),' +
                                                     'KEY `duration` (`duration`),' +
                                                     'KEY `source` (`caller`),' +
                                                     'KEY `source_reverse` (`caller_reverse`),' +
                                                     'KEY `destination` (`called`),' +
                                                     'KEY `destination_reverse` (`called_reverse`),' +
                                                     'KEY `callername` (`callername`),' +
                                                     'KEY `callername_reverse` (`callername_reverse`),' +
                                                     'KEY `sipcallerip` (`sipcallerip`),' +
                                                     'KEY `sipcalledip` (`sipcalledip`),' +
                                                     'KEY `lastSIPresponseNum` (`lastSIPresponseNum`),' +
                                                     'KEY `bye` (`bye`),' +
                                                     'KEY `a_saddr` (`a_saddr`),' +
                                                     'KEY `b_saddr` (`b_saddr`),' +
                                                     'KEY `a_lost` (`a_lost`),' +
                                                     'KEY `b_lost` (`b_lost`),' +
                                                     'KEY `a_maxjitter` (`a_maxjitter`),' +
                                                     'KEY `b_maxjitter` (`b_maxjitter`),' +
                                                     'KEY `a_rtcp_loss` (`a_rtcp_loss`),' +
                                                     'KEY `a_rtcp_maxfr` (`a_rtcp_maxfr`),' +
                                                     'KEY `a_rtcp_maxjitter` (`a_rtcp_maxjitter`),' +
                                                     'KEY `b_rtcp_loss` (`b_rtcp_loss`),' +
                                                     'KEY `b_rtcp_maxfr` (`b_rtcp_maxfr`),' +
                                                     'KEY `b_rtcp_maxjitter` (`b_rtcp_maxjitter`),' +
                                                     'KEY `a_ua_id` (`a_ua_id`),' +
                                                     'KEY `b_ua_id` (`b_ua_id`),' +
                                                     'KEY `a_avgjitter_mult10` (`a_avgjitter_mult10`),' +
                                                     'KEY `b_avgjitter_mult10` (`b_avgjitter_mult10`),' +
                                                     'KEY `a_rtcp_avgjitter_mult10` (`a_rtcp_avgjitter_mult10`),' +
                                                     'KEY `b_rtcp_avgjitter_mult10` (`b_rtcp_avgjitter_mult10`),' +
                                                     'KEY `lastSIPresponse_id` (`lastSIPresponse_id`),' +
                                                     'KEY `payload` (`payload`),' +
                                                     'KEY `id_sensor` (`id_sensor`)' +
                                                   ') ENGINE=InnoDB AUTO_INCREMENT=2268694 DEFAULT CHARSET=latin1 ROW_FORMAT=COMPRESSED';

        dbConnection2.query(dbQuery, function(err, rows, fields) {
          if (err) {
            log.error('dbConnection2 creating cdr');
            console.log('Failed to create cdr table');
            callback(err);
          }
          else {
            callback(err);
          }
        });
      }
    ],
    function(err) {
      if (err) {
        console.log("Wrap-up:", err);
      }
      else {
        filter();
      }
    }
  );
}
