#!/usr/bin/env node

// This example shows:
//   - Creation and use of a write stream.

// Note: The return value of the write needs to evaluated.  It is provided for throttling.
//       No more writes should be performed until the application receives a 'drain' event
//       on the stream.

var fs = require('fs');

var writeStream = fs.createWriteStream('stream.txt', { flags: 'w', encoding: null, mode: 511 });
var retVal;

for (var i = 0; i < 1000000; ++i) {
  retVal = writeStream.write('I love Node.js\n');

  if (retVal === false) {
    console.log('writeStream.write returned false on iteration', i);
    break;
  }
}

writeStream.on('drain', function(err) {
  if (err) {
    console.log('Error on drain event', err.stack);
  }
  console.log('Received drain event on writeStream');
});

// The following is the solution from the Node.js documentation.

// Write the data to the supplied writable stream 1MM times.
// Be attentive to back-pressure.
//function writeOneMillionTimes(writer, data, encoding, callback) {
//  var i = 1000000;
//  write();
//  function write() {
//    var ok = true;
//    do {
//      i -= 1;
//      if (i === 0) {
//        // last time!
//        writer.write(data, encoding, callback);
//      } else {
//        // see if we should continue, or wait
//        // don't pass the callback, because we're not done yet.
//        ok = writer.write(data, encoding);
//      }
//    } while (i > 0 && ok);
//    if (i > 0) {
//      // had to stop early!
//      // write some more once it drains
//      writer.once('drain', write);
//    }
//  }
//}
