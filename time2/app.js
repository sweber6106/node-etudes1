#!/usr/bin/env node

moment = require('moment');

console.log('moment().format() .......', moment().format());
console.log('moment().unix() .........', moment().unix());

console.log('moment.utc().format() ...', moment.utc().format());
console.log('moment.utc().unix() .....', moment.utc().unix());
