#!/usr/bin/env node

function logCar(callback) {
  process.nextTick(function() {
    callback();
  });
}

var cars = ['Ferrari', 'Porsche', 'Bugatti'];

//*******************************************
// This for loop demonstrates the problem of
// callback execution context.
//*******************************************
for (var idx in cars) {
  var message = 'Saw a ' + cars[idx];

  logCar(function() {
    console.log('Normal callback: ' + message);
  });
}

//******************************************************
// This for loop demonstrates the canonical solution to
// the above problem (employing an IIFE). 
//******************************************************
for (var idx in cars) {
  var message = 'Saw a ' + cars[idx];

  (function (msg) {
    logCar(function() {
      console.log('Closure callback: ' + msg);
    });
  }) (message);
}
