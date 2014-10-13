/* jshint node: true */
'use strict';

/* jshint -W074 */

#!/usr/bin/env node

// This example program shows that:
//    - When a error occurs in the iterator function, the series
//      is terminated.
//    - The callback function passed as a parameter to async.eachSeries()
//      is not called until the iterator function is called for each
//      item in the series OR an error occurs.

var async = require("async");

var animals = [];

animals.push("aardvark");
animals.push("beaver");
animals.push("cat");
animals.push("dog");
animals.push("elephant");
animals.push("tahr");
animals.push("goat");

function iteratorFunction(item, callback) {
  if (item === 'cat') {
    console.log('item caused a failure: ' + item);
    callback('item caused a failure: ' + item);
  }
  else {
    console.log('Processing', item);
    callback(null);
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

console.log('end of source file');
