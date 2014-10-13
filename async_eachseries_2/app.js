#!/usr/bin/env node

// This example program shows that:
//    - When processing an array of objects, the array element is passed to
//      the iterator function by reference.

async = require("async");

var flowers = [];

var flower = {};

flower.name = 'Bluebonnet';
flower.color = 'blue';

flowers.push(flower);

flower = {};

flower.name = 'Flax';
flower.color = 'yellow';

flowers.push(flower);

async.series(
  [
    function(callback) {
      examineArray(flowers, callback);
    },
    function(callback) {
      processArray(flowers, callback);
    },
    function(callback) {
      examineArray(flowers, callback);
    }
  ],
  function() {
    console.log('async.series wrap-up');
  }
);
    
function iterator(item, callback) {
  if (item.color === 'yellow') {
    item.color = 'blue';
  }
  callback();
}

function processArray(flowers, callback) {
  async.eachSeries(flowers, iterator, function(err) {
    if (err) {
      throw err;
    }
    else {
      console.log('async.eachSeries() - complete');
    }
    callback();
  });
}

function examineArray(flowers, callback) {
  for (var i = 0; i < flowers.length; ++i) {
    console.log(flowers[i].name);
    console.log(flowers[i].color);
  }
  callback();
}
