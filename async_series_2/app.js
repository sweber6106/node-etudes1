#!/usr/bin/env node

// This example shows:
//   - A wrap-up function is not necessary with async.series().
//   - Errors terminate the sequence of functions.
//   - Statements after a callback reporting errors are executed.

async = require('async');

function first(callback) {
  console.log('first - top of function');
  callback(null);
}

function second(callback) {
  console.log('second - top of function');
  callback('intentional error');
  console.log('second - AFTER callback with error');
}

function third(callback) {
  console.log('third - top of function');
  callback(null);
}

async.series(
  [
    function(callback) {
      first(callback);
    },
    function(callback) {
      second(callback);
    },
    function(callback) {
      third(callback);
    }
  ]
);

console.log('processing complete');
