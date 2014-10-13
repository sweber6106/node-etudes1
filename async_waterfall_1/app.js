#!/usr/bin/env node

var async = require('async');

// This example shows:
//   - async.waterfall() works differently than
//     async.series() in that code that follows
//     the waterfall is allowed to run before
//     the waterfall code runs.

async.waterfall(
  [
    function(callback) {
      console.log('inside first stage');
      callback(null, 'value from first');
      console.log('first stage after callback');
    },
    function(argFromPrevious, callback) {
      console.log('In second stage, argument from previous:', argFromPrevious);
      callback(null);
      console.log('second stage after callback');
    }
  ],
  function(err) {
    if (err) {
      console.log('wrap-up function with error:', err);
    }
    else {
      console.log('wrap-up function with no errors');
    }
  }
);

console.log('processing complete');
