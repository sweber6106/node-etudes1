#!/usr/local/bin/node

var moment = require('moment');

var day = moment();

console.log('today:');
console.log('   formatted string ...', day.format());

console.log('   year ...............', day.get('year'));
console.log('   month ..............', day.get('month') + 1);
console.log('   day ................', day.get('date'));
console.log();

for (var i = 0; i < 9; ++i) {
  day.subtract('days', 1);

  console.log('days ago:', i + 1);

  console.log('   formatted string ...', day.format());

  console.log('   year ...............', day.get('year'));
  console.log('   month ..............', day.get('month') + 1);
  console.log('   day ................', day.get('date'));
  console.log();
}


/*
function load_file_contents(path, callback) {
  async.waterfall([
    function(callback) {
      console.log("Calling fsopen()");
      fs.open(path, 'r', callback);
    },
    function(f, callback) {
      fs.fstat(f, function(err, stats) {
        if (err) {
          console.log("Inside fstat() with error");
          callback(err);
        }
        else {
          console.log("Inside fstat() without error");
          callback(null, f, stats);
        }
      });
    },
    function(f, stats, callback) {
      if (stats.isFile()) {
        var b = new Buffer(10000);
        fs.read(f, b, 0, 10000, null, function(err, br, buf) {
          if (err) {
            console.log("Inside fread() with error");
            callback(err);
          }
          else {
            console.log("Inside fread() without error");
            callback(null, f, b.toString('utf8', 0, br));
          }
        });
      }
      else {
        console.log("Inside not a file");
        callback({ error: "not_file",
                   message: "Can't load directory" });
      }
    },
    function(f, contents, callback) {
      fs.close(f, function(err) {
        if (err) {
          console.log("Inside fclose() with error");
          callback(err);
        }
        else {
          console.log("Inside fclose() without error");
          callback(null, "do dah day");
        }
      });
    }
  ],

  function(err, file_contents) {
    console.log("Final aggregator callback");

    if (err) {
      console.log("Final aggregator with error:", err);
    }
    else {
      console.log("Final aggregator without error");
      console.log("File contents:\n", file_contents);
    }
    callback(err, file_contents);
  });
}

load_file_contents("splarf.txt", function(err, file_contents) {
  console.log("Callback supplied at call to load_file_contents");

  if (err) {
    console.log("Caller with error:", err);
  }
  else {
    console.log("Caller without error");
  }
});
*/
