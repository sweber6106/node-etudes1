#!/usr/bin/env node

/* jshint node: true */
'use strict';

/* jshint -W074 */

//
// subscriber.js
//

var redis = require('redis');

var REDIS_URL  = 'localhost';
var REDIS_PORT = 6379;

var client = redis.createClient(REDIS_PORT, REDIS_URL);

client.on("message", function(channel, message) {
  console.log("[" + channel + "] " + message);
});

client.on('error', function(err) {
  log.error('redis error:', err);
});

//client.subscribe("one.com");
//client.subscribe("two.com");
//client.subscribe("three.com");

client.subscribe('cdr');
client.subscribe('batch');
