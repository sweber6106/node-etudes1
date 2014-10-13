#!/usr/bin/env node

/* jshint node: true */
'use strict';

/* jshint -W074 */

//
// MongoDB/mongoose app that writes a collection whose records expire.
//

var async    = require('async');
var fs       = require('fs');
var mongoose = require('mongoose');

var db = null;

var cfgMongoDbUrl = 'mongodb://localhost/evanescent';

(function startup() {
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
      }
    ],
    function(err) {
      if (err) {
        throw(err);
      }
      else {
        console.log('series complete');
      }
    }
  );
}) ();

function startMongoDb(callback) {
  var options = {
    server:  { socketOptions: { keepalive: 1 } },
    replset: { socketOptions: { keepalive: 1 } }
  };

  var connectWithRetry = function() {
    return mongoose.connect(cfgMongoDbUrl, options, function(err) {
      if (err) {
        setTimeout(connectWithRetry, 5000);
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
    console.log('db closed');
  });

  db.connection.on('reconnected', function() {
    console.log('db reconnected');
  });

  db.connection.on('fullsetup', function() {
    console.log('db fullsetup');
  });
}

var DiaphanousThing;

function defineSchema(callback) {
  var thingSchema = new mongoose.Schema({
    name:  String,
    created: { type : Date, expires : 60, default: Date.now } 
  });

  DiaphanousThing = mongoose.model('DiaphanousThing', thingSchema);

  callback(null);
}

function iterator(element, callback) {
  var thing;

  thing = new DiaphanousThing();
  thing.name = element;

  thing.save(function(err, thing, numberAffected) {
    if (err) {
      callback(err);
    }
    else {
      console.log('database record saved');
      callback();
    }
  });
}

function populateCollection(callback) {
  var things = ['youth', 'health', 'desire', 'infatuation', 'strength'];

  async.eachSeries(things, iterator, function(err) {
    if (err) {
      callback(err);
    }
    else {
      console.log('async.eachSeries() complete');
      callback();
    }
  });
}
