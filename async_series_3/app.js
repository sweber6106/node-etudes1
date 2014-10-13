#!/usr/bin/env node

// This example shows:
//   - Operation of the optional wrap-up function
//     used with async.series()

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
  ],
  function(err) {
    if (err) {
      console.log('wrap-up function error:', err);
    }
    else {
      console.log('wrap-up function, no errors');
    }
  }
);

console.log('processing complete');
