#!/usr/bin/env node

// setImmediate(callback, [arg], [...])#
//
// To schedule the "immediate" execution of callback after I/O events callbacks and before 
// setTimeout and setInterval . Returns an immediateObject for possible use with 
// clearImmediate(). Optionally you can also pass arguments to the callback.
//
// Immediates are queued in the order created, and are popped off the queue once per loop
// iteration. This is different from process.nextTick which will execute 
// process.maxTickDepth queued callbacks per iteration. setImmediate will yield to the 
// event loop after firing a queued callback to make sure I/O is not being starved. While 
// order is preserved for execution, other I/O events may fire between any two scheduled 
// immediate callbacks.

function logCar(callback) {
  setImmediate(function() {
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
