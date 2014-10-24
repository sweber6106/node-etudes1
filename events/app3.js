#!/usr/bin/env node

'use strict';

// shows a simple usage of self = this.

var util = require('util');
var events = require('events');

console.log('emitter etude 3');

function Dog() {
  this.on('speak', function() {
    console.log('arf');
  });
}

Dog.prototype = new events.EventEmitter();
util.inherits(Dog, events.EventEmitter);

Dog.prototype.barker = function() {
  var self = this;

  setInterval(function() {
    // the following line won't work because there is no 'this' when the callback is called
    //this.emit('speak');

    self.emit('speak');
  }, 1000);
};

var myDog = new Dog();

myDog.barker();