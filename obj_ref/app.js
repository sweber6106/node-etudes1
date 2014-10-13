#!/usr/bin/env node

// Shows that objects appear to be passed by reference.  If
// you make a change to a passed-in object, it shows up in
// the original object.
var async = require('async');

var first = {};
first.value = 17;

var second = {};
second.value = 25;

var third = {};
third.value = 42;

var myThing = [];

myThing['blah'] = first;
myThing['foo'] = second;
myThing['bar'] = third;

function iterator(key, callback) {
  var obj = myThing[key];

  obj.value += 1;
  console.log('In iterator, value:', JSON.stringify(obj));
  console.log('In iterator, value:', JSON.stringify(myThing[key]));

  callback();
}

async.series(
  [
    function(callback) {
      var keys = Object.keys(myThing);

      async.eachSeries(keys, iterator, function(err) {
        if (err) {
          throw(err);
        }
        callback();
      });
    }
  ],
  function(err) {
    if (err) {
      throw(err);
    }

    Object.keys(myThing).forEach(function(key) {
      console.log('myThing[' + key + '] = ' + JSON.stringify(myThing[key])); 
    });
  }
);
