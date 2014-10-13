/* jshint node: true */
'use strict';

/* jshint -W074 */

//
// dump-db-native - Dump specified Mongo database using the native Mongo driver.
//

var nopt = require('nopt');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
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

MongoClient.connect('mongodb://localhost:27017/' + databaseName, function(err, db) {
  assert.equal(err, null);

  var collection = db.collection(collectionName);

  var stream = collection.find().stream();

  stream.on('data', function(item) {
    console.log(item);
  });

  stream.on('end', function(err) {
    assert.equal(err, null);
    process.exit(0);
  });
});
