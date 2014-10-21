#!/usr/bin/env node

'use strict';

// minimal object extension with emitter capabilities
//   - object must have a handler for an event to receive it.
//   - object only receives events emitted by itself.

var util = require('util');
var events = require('events');

console.log('emitter etude 1');

// these declarations are equivalent
//var Flower = function(color) {
function Flower(color) {
  var self = this;

  this.color = color;

  events.EventEmitter.call(this);
}

util.inherits(Flower, events.EventEmitter);
// the following technique is deprecated according to mdn
//Flower.prototype.__proto__ = events.EventEmitter.prototype;

var f1 = new Flower('yellow');
var f2 = new Flower('blue');

f1.addListener('splarf', function() {
  console.log('splarf received on f1 via addListener');
});
f2.addListener('splarf', function() {
  console.log('splarf received on f2 via addListener');
});

f1.addListener('yop', function() {
  console.log('yop received on f1 via addListener');
});
f2.addListener('yop', function() {
  console.log('yop received on f2 via addListener');
});

setInterval(function() {
  console.log('x');

  f1.emit('gleef');
  f1.emit('splarf');

  f2.emit('gleef');
  f2.emit('yop');
}, 3000);