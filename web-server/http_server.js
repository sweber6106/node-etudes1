#!/usr/bin/env node

'use strict';

var http = require('http');
 
var s = http.createServer(function(req, res) {
  console.log('Responding to client message.');
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end("hello world\n");
});
 
s.listen(8000);

console.log('HTTP server listening on port 8000');
