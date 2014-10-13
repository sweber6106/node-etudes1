#!/usr/local/bin/node

var Chance = require('chance');

var chance = new Chance();

var array1 = [];


for (var i = 0; i < 5; ++i) {
  var object = new Object();

  object.first = chance.integer({min:3, max:17});
  object.second = chance.string({length:10});

  array1.push(object);  
}

for (var i = 0; i < array1.length; ++i) {
  console.log('first .... ', array1[i].first);
  console.log('second ... ', array1[i].second);
  console.log();
}
