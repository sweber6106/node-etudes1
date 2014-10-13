#!/usr/bin/env node
 
/* jshint node: true */
'use strict';

/* jshint -W074 */

//
// vqda.js
//

console.log('vqda v1.0');

var fs = require('fs');
var contents;

var rs = fs.createReadStream('all.txt');

rs.on('readable', function() {
  var str;
  var d = rs.read();

  if (d) {
    if (typeof d === 'string') {
      str = d;
    }
    else {
      if (typeof d === 'object' && d instanceof Buffer) {
        str = d.toString('utf8');
      }
    }

    if (str) {
      if (!contents) {
        contents = d;
      }
      else {
        contents += str;
      }
    }
  }
});

rs.on('end', function() {
  console.log('read in the file contents: ');
  var stringData = contents.toString('utf8');
  //console.log(stringData);
  var jsonData = JSON.parse(stringData);

  //console.log(jsonData);

  console.log('total = ', jsonData.total);

  jsonData.results.forEach(function(item, index) {
    console.log(index);
    //console.log(item.connect_duration);
    console.log(item.lastSIPresponseNum);
  });

});
