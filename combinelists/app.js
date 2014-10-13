#! /usr/bin/env node

// node app to combine two text files containing lists, resulting in a list with no duplicates

'use strict';

var fs = require('fs');
var _ = require('underscore');

var callers = fs.readFileSync('./callers.txt', 'utf8');
var callersNames = callers.split('\n');

var calleds = fs.readFileSync('./calleds.txt', 'utf8');
var calledsNames = calleds.split('\n');

var unionArray = _.union(callersNames, calledsNames);

for (var i = 0; i < unionArray.length; ++i) {
  console.log(unionArray[i]);
}
