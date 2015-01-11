#!/usr/bin/env node

'use strict';

var http = require('http');

var options = {
  hostname: '192.168.1.15',
  port: 8000
};

var req = http.request(options, function(res) {
  console.log('Status .... ' + res.statusCode);
  console.log('Headers ... ' + JSON.stringify(res.headers));

  res.setEncoding('utf8');

  res.on('data', function(chunk) {
    console.log('Body ...... ' + chunk);
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

req.write('This is client data being sent to the server\n');
req.end();
