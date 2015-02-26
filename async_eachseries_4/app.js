#!/usr/bin/env node

// Shows several methods for processing a large array with async.eachSeries().

'use strict';

var Chance = require('chance');
var async = require('async');
var fs = require('fs');

var chance = new Chance();

var stuff = [];

for (var i = 0; i < 10000; ++i) {
  var element = {};

  element.ordinal = i + 1;
  element.firstname = chance.first();
  element.lastname = chance.last();
  element.ssn = chance.ssn();
  element.address = chance.address();

  stuff.push(element);
}

for (i = 0; i < stuff.length; ++i) {
  console.log(stuff[i].ssn);
}

// Shows, when using 'callback()', that the app consumes all of the available stack
// and then crashes.
// Using 'return callback()' also crashes for the same reason (the call to callback()
// doesn't return until all the downstream calls to callback() have returned).
// setImmediate(callback) works because it puts the callback() call on the work queue
// and then returns (no stack buildup).

function iterator(element, callback) {
  console.log(element.lastname);
  callback();
  //return callback();
  //setImmediate(callback);
}

/*
// Shows that having an iterator that calls an asynchronous function removes the
// need for setImmediate().
 
function iterator(element, callback) {
  var name = element.firstname + ' ' + element.lastname + '\n';
  fs.writeFile('names.txt', name, { flag: 'a' }, function (err) {
    if (err) throw err;
    console.log(name);
    callback();
  });                                                                      
}
*/

async.eachSeries(stuff, iterator, function(err) {
  if (err) {
    console.log('Wrap-up: ', err);
    return;
  }
  console.log('Successful iteration');
});
