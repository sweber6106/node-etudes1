#!/usr/bin/env node

var Chance = require('chance');
var chance = new Chance();

if (process.argv.length >= 2) {
  var count = process.argv[2];
}
else {
  console.log('usage: ./app.js <count>');
  return;
}

console.log('drop database chaos0;');
console.log('create database chaos0;');
console.log('use chaos0;');
console.log('create table fuzz1( name VARCHAR(50), description VARCHAR(200), number INTEGER UNSIGNED, PRIMARY KEY(name) );');
console.log();

for (var i = 0; i < count; ++i) {
  var number = chance.integer({min:0, max:4294967295});
  var name = chance.string();
  var description = chance.sentence({words: 10});

  //console.log("insert into fuzz1 (name, description, number) VALUES ( \'" + name + "\', \'" + description + "\', " + number + " );");
  console.log("insert into fuzz1 (name, description, number) VALUES ( \"" + name + "\", \"" + description + "\", " + number + " );");
}
