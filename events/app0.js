#!/usr/bin/env node

'use strict';

var events = require('events');

console.log('emitter etude 0');

var emitter = new events.EventEmitter();

// this emit would be lost because it occurs before a listener is added
//emitter.emit('yap');

emitter.addListener('yap', function() {
  console.log('emitter.yap event received via addListener');
});
emitter.on('yap', function() {
  console.log('emitter.yap event received via on');
});
emitter.once('yap', function() {
  console.log('emitter.yap event received via once');
});
emitter.emit('yap');

setInterval(function() {
  console.log('x');
  emitter.emit('yap');
}, 3000);