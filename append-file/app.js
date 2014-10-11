#!/usr/bin/env node

// Surprisingly, the lines output below do not appear in order
// in the stuff.txt file.  If you uncomment the else clause below,
// however, the console and stuff.txt have the lines the the
// expected order.

'use strict';

var fs = require("fs");

function logIt(data) {
  fs.appendFile("./stuff.txt", data, function(err) {
    if (err) {
      throw err;
    }
//    else {
//      console.log(data);
//    }
  });
}

logIt('01 - first line\n');
logIt('02 - second line\n');
logIt('03 - third line\n');
logIt('04 - fourth line\n');
logIt('05 - fifth line\n');