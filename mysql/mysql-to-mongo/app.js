#! /usr/bin/env node

'use strict';

var async    = require('async');
var mongoose = require('mongoose');
var _        = require('underscore');
var mysql    = require('mysql');
var Chance   = require('chance');

var chance = new Chance();

var dbConnection = null;

var callerDomains = [];
var calledDomains = [];
var combinedDomains = [];
var filteredDomains = [];

var resellerNames = [];

var db;

var domainRecord;
var resellerRecord;

function startMongoDb(callback) {
  var options = {
    server:  { socketOptions: { keepAlive: 1 } },
    replset: { socketOptions: { keepAlive: 1 } }
  };

  var connectWithRetry = function() {
    return mongoose.connect('mongodb://127.0.0.1/test', options, function(err) {
      if (err) {
        // attn - temporary
        if (err.message.indexOf('Trying to open unclosed connection') === 0) {
          console.log('ignoring annoying, repetitive error');
        }
        else {
          console.log('db connect error:', err);
        }
      }
    });
  };

  db = connectWithRetry();

  db.connection.on('error', function(err) {
    console.log('db error:', err);
  });

  db.connection.on('connecting', function() {
    console.log('db connecting');
  });

  db.connection.on('connected', function() {
    console.log('db connected');
  });

  db.connection.on('open', function() {
    console.log('db opened');
    callback(null);
  });

  db.connection.on('disconnected', function() {
    console.log('db disconnected');
  });

  db.connection.on('close', function() {

  });

  db.connection.on('reconnected', function() {
    console.log('db reconnected');
  });

  db.connection.on('fullsetup', function() {
    console.log('db fullsetup');
  });
}

function defineSchema(callback) {
  var Schema = mongoose.Schema;

  var DomainSchema = new Schema({
    name :    String,
    reseller: String
  });
  domainRecord = mongoose.model('DomainRecord', DomainSchema);

  var ResellerSchema = new Schema({
    name: String
  });
  resellerRecord = mongoose.model('ResellerRecord', ResellerSchema);

  callback(null);
}

function domainsIterator(item, callback) {
  var record = new domainRecord();

  var index = chance.integer({min:0, max:resellerNames.length - 1});

  record.reseller = resellerNames[index];
  record.name = item;
  record.save(function(err) {
    if (err) {
      console.log('db error:', err);
      console.log('db event not saved:', JSON.stringify(record));
    }
    else {
      console.log('db event saved:', JSON.stringify(record));
    }
    callback(null);
  });
}

function writeDomainsCollection(callback) {
  async.eachSeries(filteredDomains, domainsIterator, function(err) {
    if (err) {
      console.log('writeDomainsCollection', err);
      callback(err);
    }
    else {
      console.log('domains collection written');
      callback(null);
    }
  });
}

function resellersIterator(item, callback) {
  var record = new resellerRecord();

  record.name = item;
  record.save(function(err) {
    if (err) {
      console.log('db error:', err);
      console.log('db event not saved:', JSON.stringify(record));
    }
    else {
      console.log('db event saved:', JSON.stringify(record));
    }
    callback(null);
  });
}

function writeResellersCollection(callback) {
  async.eachSeries(resellerNames, resellersIterator, function(err) {
    if (err) {
      console.log('writeResellersCollection', err);
      callback(err);
    }
    else {
      console.log('resellers collection written');
      callback(null);
    }
  });
}

(function startup() {
  async.series(
    [
      function(seriesCallback) {
        console.log('connecting to database');

        dbConnection = mysql.createConnection({
          host     : 'localhost',
          port     : 3306,
          user     : 'root',
          password : '',
          database : 'voipmontest'
        });

        dbConnection.connect(function(err) {
          if (err) {
            console.log('dbConnection error:', err.stack);
            seriesCallback(err);
          }
          else {
            console.log('dbConnection id:', dbConnection.threadId);
            seriesCallback(null);
          }
        });
      },
      function(seriesCallback) {
        console.log('connected to database, preparing for caller domains query');

        var dbQuery;

        dbQuery = 'SELECT DISTINCT caller_domain FROM cdr';
        dbConnection.query(dbQuery, function(err, rows) {
          if (err) {
            console.log('error SELECTING records:', err);
            seriesCallback(err);
            return;
          }

          for (var i = 0; i < rows.length; ++i) {
            /* jshint camelcase: false */
            callerDomains.push(rows[i].caller_domain);
            /* jshint camelcase: true */
          }

          console.log('records: ', rows.length);
          console.log('callerDomains: ', callerDomains.length);

          seriesCallback(null);
        });
      },
      function(seriesCallback) {
        console.log('connected to database, preparing for called domains query');

        var dbQuery;

        dbQuery = 'SELECT DISTINCT called_domain FROM cdr';
        dbConnection.query(dbQuery, function(err, rows) {
          if (err) {
            console.log('error SELECTING records:', err);
            seriesCallback(err);
            return;
          }

          for (var i = 0; i < rows.length; ++i) {
            /* jshint camelcase: false */
            calledDomains.push(rows[i].called_domain);
            /* jshint camelcase: true */
          }

          console.log('records: ', rows.length);
          console.log('calledDomains: ', calledDomains.length);

          seriesCallback(null);
        });
      },
      function(seriesCallback) {
        var i;

        console.log('combining domain lists');

        combinedDomains = callerDomains.concat(calledDomains);
        console.log('combinedDomains: ' + combinedDomains.length);

        combinedDomains = _.uniq(combinedDomains);
        console.log('combinedDomains after uniq: ' + combinedDomains.length);

        var testArray;

        for (i = 0; i < combinedDomains.length; ++i) {
          testArray = combinedDomains[i].match(/[a-zA-Z]/);
          if (testArray !== null) {
            filteredDomains.push(combinedDomains[i]);
          }
        }

        console.log('filteredDomains: ' + filteredDomains.length);

        var name;
        for (i = 0; i < 100; i++) {
          name = chance.name();
          name = name.replace(' ', '');
          resellerNames.push(name);
        }

        resellerNames = _.uniq(resellerNames);

        console.log('Domains: ' + filteredDomains);
        console.log('Resellers: ' + resellerNames);

        seriesCallback(null);
      },
      function(seriesCallback) {
        startMongoDb(seriesCallback);
      },
      function(seriesCallback) {
        defineSchema(seriesCallback);
      },
      function(seriesCallback) {
        writeDomainsCollection(seriesCallback);
      },
      function(seriesCallback) {
        writeResellersCollection(seriesCallback);
      }
    ],
    function(err) {
      if (err) {
        console.log('series wrap up error');
      }
      else {
        console.log('series finished');
      }
    }
  );
})();