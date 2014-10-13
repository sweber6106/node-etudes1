#!/usr/bin/env node

// This example shows:
//   - Calling callback() does NOT prevent statements 
//     that follow the call from being executed.
//   - Pairing return with callback() does prevent
//     further processing.

var async = require('async');

function first(callback) {
  console.log('first - top of function');
  callback(null);
  console.log('first - AFTER callback(null)!');
}

function second(callback) {
  console.log('second - top of function');
  return callback(null);
  console.log('second - after return: should never see this');
}

async.series(
  [
    function(callback) {
      first(callback);
    },
    function(callback) {
      second(callback);
    }
  ]
);

console.log('processing complete');
