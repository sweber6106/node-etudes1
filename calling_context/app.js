#!/usr/bin/env node

// This example (which does not run) shows that iterator functions
// implemented as separate functions, do not get the "calling" function's 
// variable context

var async = require('async');

var stuff = ['apple', 'orange', 'pear', 'grape'];

function iterator(item, callback) {
  magicVariable += 1;
}

(function handler() {
 
  var magicVariable;

  async.series(
    [
      function(callback) {
        async.eachSeries(stuff, iterator, function(err) {
          if (err) {
            throw(err);
          }
        });
      }
    ],
    function() {
      console.log('wrap-up function');
      csonele.log('magicVariable:', magicVariable);
    }
  );
}) ();
