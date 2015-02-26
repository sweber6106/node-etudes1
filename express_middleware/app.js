#!/usr/bin/env node

'use strict';

var express    = require('express');
var fs         = require('fs');
var morgan     = require('morgan');
var http       = require('http');
var bodyParser = require('body-parser');

var app = express();

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'});

app.use(function(req, res, next) {
  console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  console.log(req.body);
  console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  next();
});

app.use(bodyParser.json());

app.use(function(req, res, next) {
  console.log('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  console.log(req.body);
  console.log('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  console.log('cccccccccccccccccccccccccccccccccccccccccccccccccccc');
  console.log(req.connection.remoteAddress);
  console.log('cccccccccccccccccccccccccccccccccccccccccccccccccccc');
  next();
});

app.use(morgan('dev', {stream: accessLogStream}));

app.get('/', function (req, res) {
  res.send('hello, world!');
});

app.get('/test/', function(req, res) {
  res.send('hello, test!');
});

var host = '127.0.0.1';
var port = 8181;

http.createServer(app).listen(port, host, function() {
  console.log('ssl server started:', host + ':' + port);
});