#!/usr/bin/env node

// shows what happens when a non-existent array element is specified

var flowers = [];

flowers['blue'] = 'blue-eyed grass';
flowers['purple'] = 'singletary pea';
flowers['yellow'] = 'yellow puff';

var example;
for (var i = 0; i < flowers.length; ++i) {
  example = flowers[i];
  console.log(example);
}

example = flowers['blue'];
console.log();
console.log('flowers[blue] =', example);
console.log();

example = flowers['red'];

if (example === undefined) {
  console.log('flowers[red] is undefined');
}
else {
  console.log('flowers[red] has unexpected value');
}
console.log();
