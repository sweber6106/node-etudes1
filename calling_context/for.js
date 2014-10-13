#!/usr/bin/env node

# demonstrates closure and IIFE concepts using for loops.

'use strict';

//var i;

//for (i = 0; i < 5; ++i) {
//  console.log(i);
//}

//for (i = 10; i < 15; ++i) {
//  setTimeout(function() { console.log('test1'); console.log(i); }, 3000);
//}

//for (i = 20; i < 25; ++i) {
//  setTimeout((function() { console.log('test2'); console.log(i); }) (), 3000);
//}


var result = (function() { console.log('test3'); console.log(42); }) ();

console.log('result:', result);

setTimeout(result, 2000);
//setTimeout(undefined, 1000);
