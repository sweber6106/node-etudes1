#!/usr/local/bin/node

var exec = require('child_process').exec;
 
exec('sort stuff.txt', function (error, stdout, stderr) {
  console.log('stdout: ' + stdout);
  console.log('stderr: ' + stderr);
  if (error !== null) {
    console.log('exec error: ' + error);
  }
});
