#!/usr/bin/env node

// Demonstrates event timing using console.time() and console.timeEnd()
// Note: Node's implementation of setTimeout() is different than JavaScript's.
//       The node version allows the passing of parameters to the callback.

function simpleTimeout(consoleTimer) {
  console.timeEnd(consoleTimer);
}

console.time('label_2sec');
setTimeout(simpleTimeout, 2000, 'label_2sec');

console.time('label_1sec');
setTimeout(simpleTimeout, 1000, 'label_1sec');

console.time('label_500ms');
setTimeout(simpleTimeout, 500, 'label_500ms');

console.time('label_3sec');
setTimeout(simpleTimeout, 3000, 'label_3sec');

console.time('label_5sec');
setTimeout(simpleTimeout, 5000, 'label_5sec');
