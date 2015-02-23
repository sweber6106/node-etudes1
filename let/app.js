#!/usr/bin/env node

'use strict';

for (let i = 0; i < 7; i++) {
  console.log(i);
}
// i is undefined here
//console.log(i);

for (var j = 0; j < 7; j++) {
  console.log(j);
}
console.log(j);

console.log();
console.log('-----------------------------------');
console.log();

{
  let bat = 17;

  {
    let bat = 19;
  }

  console.log('Hoisting test: ' + bat);
}

console.log();
console.log('-----------------------------------');
console.log();

console.log('Hoisting test');
console.log('fuzz: ', fuzz);
// next line produces 'fuss is not defined'
//console.log('fuss: ', fuss);

{
  var fuzz = 2;
  let fuss = 3;
}

console.log();
console.log('-----------------------------------');
console.log();

{
  console.log('Temporal dead zone test');

  // the following line results in "fuse is not defined"
  // console.log('fuse: ', fuse);

  let fuse = 2;
}

console.log();
console.log('-----------------------------------');
console.log();

for (var k = 0; k < 7; k++) {
  var foo = k;
  let bar = k;
  setTimeout(function() {
    console.log('Closure test of k:   ', k);
    console.log('Closure test of foo: ', foo);
    console.log('Closure test of bar: ', bar);
    console.log();
  }, 1000);
}


