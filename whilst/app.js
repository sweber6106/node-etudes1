#!/usr/bin/env node

var async = require('async');

console.log('This code demonstrates whilst from the async library');

var testCount = 0;

async.doWhilst(
  function(callbackWhilst) {
    async.series(
      [
        function(callback) {
          console.log('This is series stage 1.');
          ++testCount;
          callback();
        },
        function(callback) {
          console.log('This is series stage 2.');
          callback();
        },
        function(callback) {
          console.log('This is series stage 3.');
          callback();
        }
      ],
      function(err) {
        console.log('This is the series wrap-up.');
        callbackWhilst();
      }
    );
  },
  function(callback) {
    console.log('This is the condition test');
    return (testCount < 10);
  },
  function(err) {
    console.log('This is the wrap-up or error code');
  }
);

console.log('post whilst');
