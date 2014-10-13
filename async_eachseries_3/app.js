#!/usr/bin/env node

/* jshint node: true */
'use strict';

/* jshint -W074 */

var async = require("async");

var animals = [];

animals.push("aardvark");
animals.push("beaver");
animals.push("cat");
animals.push("dog");
animals.push("elephant");
animals.push("fox");
animals.push("goat");

function iteratorFunction(item, callback) {
  console.log('Processing', item);

  switch (item) {
    case 'aardvark':
    case 'beaver':
    case 'cat':
    case 'dog':
      process.nextTick(function() {callback();});
      //setImmediate(function() {callback();});
      break;
 
    case 'elephant':
    case 'fox':
    case 'goat':
      //process.nextTick(function() {callback();});
      setImmediate(function() {callback();});
      break;

    default:
      break;
  }
}

async.eachSeries(animals, iteratorFunction, function(err) {
  if (err) {
    console.log('Completion function, error: ', err);
  }
  else {
    console.log('Completion function, no errors');
  }
});

console.log('*************************************************');
console.log(process.memoryUsage());
console.log('*************************************************');
console.log(process._getActiveHandles());
console.log('*************************************************');
console.log(process._getActiveRequests());
console.log('*************************************************');
console.log('end of source file');
