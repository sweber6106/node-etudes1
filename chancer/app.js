#!/usr/local/bin/node

var Chance = require('chance');
var moment = require('moment');

var chance = new Chance(); 

console.log('Random integer: ', chance.integer({min:1, max:17}));

console.log('Current timestamp: ', moment().format('MMMM Do YYYY, h:mm:ss a'));
