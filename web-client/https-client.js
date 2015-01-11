#!/usr/bin/env node

'use strict';

var https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var options = {
  hostname: '192.168.1.15',
  port: 8000
//  path: '/',
//  method: 'GET'
};

var req = https.request(options, function(res) {
  console.log('Status .... ' + res.statusCode);
  console.log('Headers ... ' + JSON.stringify(res.headers));

  res.on('data', function(chunk) {
    console.log('Body ...... ' + chunk);
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

req.write('This is client data being sent to the server\n');
req.end();
