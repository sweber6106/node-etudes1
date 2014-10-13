/* jshint node: true */
'use strict';

/* jshint -W074 */

//
// dump-db-mongoose - Dump specified Mongo database using the mongoose driver.
//

var mongoose = require('mongoose');
var nopt = require('nopt');
var path = require('path');
var assert = require('assert');

function usage() {
  var exec = process.argv[0] + ' ' + path.basename(process.argv[1]);

  console.log('Usage:');
  console.log('  ' + exec + ' -d database -c collection');
  console.log('Options:');
  console.log('  -d, --database [database name]');
  console.log('  -c, --collection [collection name]');
  console.log('  -h, --help');
  process.exit(0);
}

var longOptions = {
  'database'   : String,
  'collection' : String,
  'help'       : Boolean
};

var shortOptions = {
  'd' : ['--database'],
  'c' : ['--collection'],
  'h' : ['--help']
};

var databaseName;
var collectionName;

var argv = nopt(longOptions, shortOptions, process.argv, 2);

if (argv.help) {
  usage();
}

if (argv.database) {
  databaseName = argv.database;
}
else {
  usage();
}

if (argv.collection) {
  collectionName = argv.collection;
}
else {
  usage();
}

console.log('Dump of database: ' + databaseName + ' collection: ' + collectionName);

mongoose.connect('mongodb://localhost/' + databaseName, function(err) {
  assert.equal(null, err);

  var Collection = mongoose.model(collectionName, new mongoose.Schema({}));
  var stream = Collection.find().stream();

  stream.on('data', function(doc) {
    console.log(doc);
  });

  stream.on('error', function (err) {
    throw err;
  });

  stream.on('close', function () {
    process.exit(0);
  });
});

