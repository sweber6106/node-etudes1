#!/usr/bin/env node

'use strict';

// The '__proto__' area of an object corresponds to (is a reference to) the 'prototype' area of the object that this object was derived from.

function foo() {
}

foo.prototype.value = 42;
foo.__proto__.value = 27;

console.log('foo.prototype.value: ' + foo.prototype.value);     // 42
console.log('foo.value: ' + foo.value);                         // 27
console.log('foo.__proto__.value: ' + foo.__proto__.value);     // 27

var baz = new foo();
var bat = new foo();

console.log(baz.__proto__ === foo.prototype);                   // true

console.log('baz.value: ' + baz.value);                         // 42
console.log('baz.__proto__.value: ' + baz.__proto__.value);     // 42

// Cannot read property 'value' of undefined
// console.log('baz.prototype.value: ' + baz.prototype.value);

baz.__proto__.value = 43;

console.log('baz.value: ' + baz.value);                         // 43
console.log('bat.value: ' + bat.value);                         // 43
console.log('foo.prototype.value: ' + foo.prototype.value);     // 43

foo.prototype.value = 69;

console.log('baz.value: ' + baz.value);                         // 69
console.log('bat.value: ' + bat.value);                         // 69
