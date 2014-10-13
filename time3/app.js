#!/usr/bin/env node

var moment = require('moment');

var input = 'Mon Jun 09 2014 21:47:03 GMT-0500 (CDT)';
var index = input.indexOf(' ');

var input = input.slice(index);

var callDate = moment(input, 'MMM DD YYYY HH:mm:ss Z').format('MM-DD-YYYY HH:mm:ss Z');

console.log(callDate);
