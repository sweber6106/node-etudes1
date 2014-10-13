#!/usr/local/bin/node

var _ = require('underscore');

var stuff = [ 1, 2, 3, 4, 5, 1, 2, 3, 4, 5 ];

var unique = _.uniq(stuff);

console.log(unique);
