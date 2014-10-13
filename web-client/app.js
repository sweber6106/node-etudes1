#!/usr/bin/env node

// Note: We need etudes for both http and https.
// Note: We need to find a way to make https work without "NODE_TLS_REJECT_UNAUTHORIZED = 0"

var https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

req = https.get('https://localhost:8087/api/v1/pbx/lister/resellers', function(res) {
//req = https.get('https://localhost:8087/api/v1/pbx/lister/reseller/ApiResearch', function(res) {
  console.log('STATUS .... ' + res.statusCode);
  console.log('HEADERS ... ' + JSON.stringify(res.headers));

  res.on('data', function(d) {
    process.stdout.write(d);
  });
});

req.on('error', function(e) {
  console.error(e);
});
