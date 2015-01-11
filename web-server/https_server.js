#!/usr/bin/env node

// The test-key.pem and test-cert.pem files were made with the following commands:
//   openssl genrsa -out test-key.pem
//   openssl req -new -key test-key.pem -out certreq.csr
//   openssl x509 -req -days 3650 -in certreq.csr -signkey test-key.pem -out test-cert.pem

'use strict'

var https = require('https');
var fs = require('fs');

var options = {
  key: fs.readFileSync('./test-key.pem'),
  cert: fs.readFileSync('./test-cert.pem')
};

https.createServer(options, function (req, res) {
  console.log('Responding to client message.');
  res.writeHead(200);
  res.end("hello world\n");
}).listen(8000);

console.log('HTTPS server listening on port 8000');
