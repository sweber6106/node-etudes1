#!/usr/bin/env node

# This example shows that the length property of a map is zero.

var async = require('async');

var things = [];

things['longing'] = 'spinach';
things['despair'] = 'subtlety';
things['hope'] = 'ginko';

console.log('things.length =', things.length);

var keys = Object.keys(things);

function iterator(item, callback) {
  console.log('things[key] ...', things[item]);
  callback();
}

async.eachSeries(keys, iterator, function(err) {
  if (err) {
    console.log('bad news');
  }
  else {
    console.log('async.eachSeries complete');
  }
});
