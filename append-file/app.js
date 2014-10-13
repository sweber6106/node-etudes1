#!/usr/bin/env node

// Surprisingly, on my Mac, the lines output below do not appear 
// in order in the stuff.txt file.  If you uncomment the else clause
// below, however, the console and stuff.txt have the lines in the
// expected order.
// Also interesting is that this out-of-order behavior persists
// across Node.js versions on the Mac.  This behavior seems rarer
// on Linux but does occur.
//
// This issue was reported on Github (#8544) on 10/13/2014.  The concensus
// there is that this behavior is "works as designed."
// According to Christopher Watford: "this is due to the asynchronous 
// behavior of appendFile. While each of the calls to logIt() will 
// occur in-order, the actual appending is not guaranteed to occur 
// in-order when called asynchronously."

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
