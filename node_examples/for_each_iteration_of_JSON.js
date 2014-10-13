#!/usr/bin/env node
 
/* jshint node: true */
'use strict';

/* jshint -W074 */

console.log('vqda v1.0');

var jsonData = require('./all');

console.log('total = ', jsonData.total);

jsonData.results.forEach(function(item, index) {
  console.log(index);
  //console.log(item.connect_duration);
  //console.log(item.lastSIPresponseNum);
  //console.log(item.lastSIPresponse);
  //console.log(item.caller);
  //console.log(item.caller_domain);
  //console.log(item.caller_with_domain);
  //console.log(item.called);
  //console.log(item.called_domain);
  //console.log(item.called_with_domain);
  console.log('ID ....... ', item.ID);
  console.log('cdr_ID ... ', item.cdr_ID);
  //console.log(item.lastSIPresponse);
  //console.log(item.lastSIPresponse);
  //console.log(item.lastSIPresponse);
  //console.log(item.lastSIPresponse);
  //console.log(item.lastSIPresponse);
});
