#!/usr/bin/env node

var myObj = {};

myObj.size = 'large';
myObj.color = 'blue';

console.log('Before deleting size property');
console.log(myObj);

delete myObj.size;

console.log('After deleting size property');
console.log(myObj);
