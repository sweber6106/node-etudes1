#!/usr/bin/env node

// This example shows that an embedded iterator function has
// access to the containing function's variable context

var async = require('async');

var stuff = ['apple', 'orange', 'pear', 'grape'];

(function handler() {
 
  var magicVariable = 27;

  async.series(
    [
      function(callback) {
        async.eachSeries(stuff, 
          function(item, callback) {
            console.log('inside iterator:', item);

            magicVariable += 1;
            callback();
          }, 
          function(err) {
            if (err) {
              throw(err);
            }
            console.log('eachSeries wrap-up function');
            callback();
          }
        );
      }
    ],
    function() {
      console.log('series wrap-up function');
      console.log('magicVariable:', magicVariable);
    }
  );
}) ();
