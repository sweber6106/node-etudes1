#!/usr/bin/env node

// The example shows different ways to output the current time.
// The problem with the first two cases is that there is no
// mechanism for zero filling for a consistent look to the output.
 
var util = require('util');
var moment = require('moment');

var currentdate = new Date();
 
var datetime = (currentdate.getMonth() + 1)  + "/" +
               currentdate.getDate() + "/" +
               currentdate.getFullYear() + " @ " + 
               currentdate.getHours() + ":" + 
               currentdate.getMinutes() + ":" + 
               currentdate.getSeconds();

console.log(datetime);


var datetime2 = util.format('%s/%s/%s @ %s:%s:%s',
                            (currentdate.getMonth() + 1),
                            currentdate.getDate(),
                            currentdate.getFullYear(),
                            currentdate.getHours(),
                            currentdate.getMinutes(),
                            currentdate.getSeconds());

console.log(datetime2);


console.log(moment().format('MM/DD/YYYY @ HH:mm:ss'));
