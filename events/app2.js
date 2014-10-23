#!/usr/bin/env node

'use strict';

// shows two different ways of calling the events.EventEmitter constructor

var util = require('util');
var events = require('events');

console.log('emitter etude 2');

function Cat() {
  this.on('speak', function() {
    console.log('meow');
  });

  events.EventEmitter.call(this);
}

util.inherits(Cat, events.EventEmitter);


function Dog() {
  this.on('speak', function() {
    console.log('arf');
  });
}

Dog.prototype = new events.EventEmitter();
util.inherits(Dog, events.EventEmitter);

var myCat = new Cat();
var myDog = new Dog();

myCat.emit('speak');
myDog.emit('speak');