#!/usr/bin/env node

/* jshint node: true */
'use strict';

/* jshint -W074 */

var geocoder = require('geocoder');

console.log('geocoder application');

geocoder.geocode("6106 Dexham Road, Rowlett, TX", function(err, data) {
  console.info(data.results[0].geometry);
});
