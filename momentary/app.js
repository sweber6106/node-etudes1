#!/usr/local/bin/node

var moment = require('moment');

console.log();
console.log('moment().format() ..........', moment().format());
console.log('moment().unix() ............', moment().unix());
console.log('moment().hours() ...........', moment().hours());
console.log();
console.log('moment.utc().format() ......', moment.utc().format());
console.log('moment.utc().unix() ........', moment.utc().unix());
console.log('moment.utc().hours() .......', moment.utc().hours());
console.log('moment.utc().minutes() .....', moment.utc().minutes());
console.log('moment.utc().seconds() .....', moment.utc().seconds());
console.log();

/*
var stuff = moment.utc([2014, 2, 28, 22, 30, 0, 0]);

console.log('quitting time (UTC):', stuff.format());

console.log('local time:', stuff._d);

console.log('stuff:', stuff);

var stuff2 = moment(stuff);

console.log('stuff2:', stuff2);

console.log('quitting time (Local):', stuff2.format());
*/

/*
var seconds = moment.duration('01:05:32').asSeconds();

console.log('seconds:', seconds);
*/
