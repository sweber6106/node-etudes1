#!/usr/bin/env node

//
// Command to test: curl http://localhost:8000
//

var http = require('http');

var s = http.createServer(function(req, res) {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end("hello world\n");
});

s.listen(8000);

console.log('http server listening on port 8000');
