#!/usr/bin/env node

var Chance = require('chance');
var chance = new Chance();

console.log('drop database chaos0;');
console.log('create database chaos0;');
console.log('use chaos0;');
console.log('create table fuzz1( name VARCHAR(50), description VARCHAR(200), number INTEGER UNSIGNED, PRIMARY KEY(name) );');
console.log();

console.log("insert into fuzz1 (name, description, number) VALUES ");

var count = 10000;

for (var i = 0; i < count; ++i) {
  var number = chance.integer({min:0, max:4294967295});
  var name = chance.string();
  var description = chance.sentence({words: 10});

  if (i === (count - 1)) {
    console.log("( \'" + name + "\', \'" + description + "\', " + number + " );");
  }
  else {
    console.log("( \'" + name + "\', \'" + description + "\', " + number + " ),");
  }
}
