#!/usr/bin/env node

// udsock_server - MySQL plugin Unix domain socket server
 
'use strict';

console.log('Unix domain socket server');

var net = require('net');
var fs = require('fs');
var async = require('async');
var log4node = require('log4node');
var sprintf  = require('sprintf');
var mongoose = require('mongoose');

var connectionSocket = null;
var dbModelFuzz      = null;
var db               = null;
var log              = null;
var writeStream      = null;

var cfgLoggerLevel   = 'info';
var cfgLoggerPath    = 'udsock_server.log';

var assemblyBuffer = '';

function timestamp(date) {
  return sprintf.sprintf('%04u-%02u-%02u %02u:%02u:%02u',
    date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

function prefix() {
  //return timestamp(new Date()) + ' [' + (cluster.isMaster ? 0 : cluster.worker.id) + ']';
  return timestamp(new Date()) + ' ';
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

function installSignalHandlers(callback) {
  [ 'SIGUSR1', 'SIGUSR2'
  ].forEach(function(signal) {
    process.on(signal, function() {
      //log.info('received signal', signal);
      console.log('received signal', signal);
    });
  });

  [ 'SIGINT'
  ].forEach(function(signal) {
    process.on(signal, function() {
      //log.info('received signal', signal);
      console.log('received signal', signal);
      console.log();
      process.exit(1);
    });
  });

  [ 'SIGHUP', 'SIGQUIT', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE',  'SIGSEGV', 'SIGTERM'
  ].forEach(function(signal) {
    process.on(signal, function() {
      //log.error('received signal', signal);
      console.log('received signal', signal);
      process.exit(1);
    });
  });

  process.on('exit', function() {
    //log.info('exiting');
    console.log('exiting');
  });
}

(function startup() {
  startLogger();

  installSignalHandlers();
  
  writeStream = fs.createWriteStream('inserts.txt', { flags: 'w', encoding: null, mode: 511 });

  writeStream.on('error', function (err) {
    console.log('writeStream error:', err);
  });
}) ();

// The argument 'c' sent to the createServer
// connection listener is a socket

var server = net.createServer(function(c) {
  console.log('server connected');
  connectionSocket = c;

  c.on('end', function() {
    console.log('server disconnected');
  });

  c.on('data', function(data) {
    //console.log(data);

    data = data.replace(/\n/g, '');

    if (data.length === 0) {
      //console.log('data.length ... 0');
      return;
    }

    assemblyBuffer += data;

    //console.log('assembly (0):', assemblyBuffer);

    var bDone = false;

    while (bDone === false) {
      if (assemblyBuffer[0] !== '{') {
        // attn - Something will have to be done here to discard
        //        extraneous bytes in the data stream.
        console.log('Opening brace not present');
        return;
      }
  
      var completeJson = '';
      var value = 1;
      for (var i = 1; i < assemblyBuffer.length; ++i) {
        if (assemblyBuffer[i] === '{') {
          ++value;
        }
        else {
          if (assemblyBuffer[i] === '}') {
            --value;
            if (value === 0) {
              completeJson = assemblyBuffer.substring(0, i + 1);
              if (i === assemblyBuffer.length - 1) {
                assemblyBuffer = '';
                //console.log('assemblyBuffer cleared (1)');
                bDone = true;
              }
              else {
                assemblyBuffer = assemblyBuffer.substring(i + 1, assemblyBuffer.length);
                //console.log('assemblyBuffer (1):', assemblyBuffer);
              }
              break;
            }
          }
        }
      }
  
      if (completeJson.length > 0) {
        var record;
  
        try {
          record = JSON.parse(completeJson);
        }
        catch (err) {
          console.log('bad buffer:', completeJson);
          return;
        }
        //console.log('query ...', record.query);
        writeStream.write(record.query + ';\n');
      }
      else {
        bDone = true;
      }
    }
  });

  c.on('timeout', function() {
    console.log('timeout event occurred');
  });

  c.on('drain', function() {
    console.log('drain event occurred');
  });

  c.on('error', function() {
    console.log('error event occurred');
  });

  c.on('close', function() {
    console.log('close event occurred');
  });

  c.write('hello\r\n');

  c.setEncoding('utf8');

  // attn - where is this documented? It echoes the data received
  //c.pipe(c);
});

server.on('error', function (e) {
  if (e.code == 'EADDRINUSE') {
    var clientSocket = new net.Socket();

    clientSocket.on('error', function(e) {
      if (e.code == 'ECONNREFUSED') { 
        fs.unlinkSync('/tmp/audit.json.sock');
        server.listen('/tmp/audit.json.sock', function() {
          console.log('server recovered');
        });
      }
    });

    clientSocket.connect({path: '/tmp/audit.json.sock'}, function() { 
      console.log('Server running, giving up...');
      process.exit();
    });
  }
});

server.listen('/tmp/audit.json.sock', function() {
  console.log('server bound');

  //fs.chmodSync('/tmp/audit.json.sock', 0777);
  fs.chmodSync('/tmp/audit.json.sock', 511);
});
