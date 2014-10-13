#!/usr/bin/env node

// example showing that a function can return an object

function makeObject() {
  var obj = {};

  obj.a = 47;
  obj.b = 26;
  obj.c = 32;

  return obj;
}

var splarf = makeObject();

console.log('object:', splarf);
