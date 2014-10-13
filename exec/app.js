#!/usr/bin/env node

var exec = require('child_process').exec;

//exec('ls -alF', function (err, stdout, stderr) {
exec('top -n 1 -b', function (err, stdout, stderr) {
  console.log('stdout: ' + stdout);
  console.log('stderr: ' + stderr);

  if (err) {
    console.log('exec error: ' + err);
  }
});
