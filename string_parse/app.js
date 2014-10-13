#!/usr/bin/env node

var query = "insert into fuzz1 (name, description, number) VALUES ( 'Dkp&k]5h@D(%4', 'Ve zanu nijogbaf venjiju kehkapam tuud taaf ukjun ju wilni.', 431540954 );";

var temp;
var keys = [];
var values = [];
var i;

var indexStart = query.indexOf('(');
var indexEnd = query.indexOf(')');

if ((indexStart !== -1) && (indexEnd !== -1)) {
  temp = query.substring(indexStart + 1, indexEnd);
  keys = temp.split(',');

  if (keys.length === 0) {
    console.log('keys array is empty');
    return;
  }

  for (i = 0; i < keys.length; ++i) {
    temp = keys[i].trim();
    keys[i] = temp.replace(/'/g, '');
  }
}
else {
  console.log('Failure parsing for keys');
  return;
}

// note: using token because data can contain parentheses

var token = 'VALUES (';
var tokenLen = token.length;

indexStart = query.indexOf(token);
indexEnd = query.lastIndexOf(')');

if ((indexStart !== -1) && (indexEnd !== -1)) {
  temp = query.substring(indexStart + tokenLen + 1, indexEnd);
  values = temp.split(',');

  if (values.length === 0) {
    console.log('values array is empty');
    return;
  }

  for (i = 0; i < values.length; ++i) {
    temp = values[i].trim();
    values[i] = temp.replace(/'/g, '');
  }
}
else {
  console.log('Failure parsing for keys');
  return;
}

if (keys.length !== values.length) {
  console.log('keys and values arrays have different lengths');
  return;
}

var obj = {};

for (i = 0; i < keys.length; ++i) {
  //Object.defineProperty(thing, keys[i], { value: values[i], writable: true, enumerable: true, configurable: true });
  Object.defineProperty(obj, keys[i], { value: values[i], enumerable: true });
  //console.log(Object.getOwnPropertyDescriptor(thing, keys[i]));
}

console.log(JSON.stringify(obj));
