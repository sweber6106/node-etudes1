#!/usr/local/bin/node

var fs = require('fs');
var async = require('async');
var path = require('path');
var _ = require('underscore');

_.str = require('underscore.string');

// Mix in non-conflict functions to Underscore namespace if you want
_.mixin(_.str.exports());

// All functions, include conflict, will be available through _.str object
_.str.include('Underscore.string', 'string');

var filename;

if (process.argv.length === 3) {
  filename = process.argv[2];

  try {
    fs.statSync(filename);
  }
  catch(err) {
    console.log(filename, 'is not a file');
    process.exit();
  }

  console.log('filename:', filename);
}
else {
  console.log('usage:', path.basename(process.argv[1]), '<filename>');
  process.exit();
}


// console.log(_s.words("I-love-you", /-/);

function readLines(input, func, callback) {
  var remaining = '';
  var bFirstline = true;

  input.on('data', function(data) {
    remaining += data;
    var index = remaining.indexOf('\n');
    var last  = 0;
    while (index > -1) {
      var line = remaining.substring(last, index);
      last = index + 1;
      func(line, bFirstline);
      bFirstline = false;
      index = remaining.indexOf('\n', last);
    }

    remaining = remaining.substring(last);
  });

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
    callback(null, "");
  });
}

var legendArray = [];
var cdrArray = [];

// ID
// calldate
// callend
// duration
// connect_duration
// progress_time
// first_rtp_time
// caller
// caller_domain
// caller_reverse
// callername
// callername_reverse
// called
// called_domain
// called_reverse
// sipcallerip
// sipcalledip
// whohanged
// bye
// lastSIPresponse_id
// lastSIPresponseNum
// sighup
// a_index
// b_index
// a_payload
// b_payload
// a_saddr
// b_saddr
// a_received
// b_received
// a_lost
// b_lost
// a_ua_id
// b_ua_id
// a_avgjitter
// b_avgjitter
// a_maxjitter
// b_maxjitter
// a_sl1
// a_sl2
// a_sl3
// a_sl4
// a_sl5
// a_sl6
// a_sl7
// a_sl8
// a_sl9
// a_sl10
// a_d50
// a_d70
// a_d90
// a_d120
// a_d150
// a_d200
// a_d300
// b_sl1
// b_sl2
// b_sl3
// b_sl4
// b_sl5
// b_sl6
// b_sl7
// b_sl8
// b_sl9
// b_sl10
// b_d50
// b_d70
// b_d90
// b_d120
// b_d150
// b_d200
// b_d300
// a_mos_f1
// a_mos_f2
// a_mos_adapt
// b_mos_f1
// b_mos_f2
// b_mos_adapt
// a_rtcp_loss
// a_rtcp_maxfr
// a_rtcp_avgfr
// a_rtcp_maxjitter
// a_rtcp_avgjitter
// b_rtcp_loss
// b_rtcp_maxfr
// b_rtcp_avgfr
// b_rtcp_maxjitter
// b_rtcp_avgjitter
// payload
// jitter
// mos_min
// a_mos_min
// b_mos_min
// packet_loss_perc
// a_packet_loss_perc
// b_packet_loss_perc
// delay_sum// a_delay_sum
// b_delay_sum
// delay_avg
// a_delay_avg
// b_delay_avg
// delay_cnt
// a_delay_cnt
// b_delay_cnt
// rtcp_avgfr
// rtcp_avgjitter
// lost
// id_sensor
// cdr_ID
// custom_header1
// match_header
// fbasename

function func(data, bFirstline) {
  var temp = _.str.rtrim(data, "\n");

  if (bFirstline) {
    legendArray = _.str.words(temp, "|");
  }
  else {
    lineArray = _.str.words(temp, "|");

    if (legendArray.length === lineArray.length) {
      var cdr = {};

      cdr.callId = lineArray[_.indexOf(legendArray, 'fbasename')];
      cdr.calldate = lineArray[_.indexOf(legendArray, 'calldate')];
      cdr.duration = lineArray[_.indexOf(legendArray, 'duration')];
      cdr.caller = lineArray[_.indexOf(legendArray, 'caller')];
      cdr.callerDomain = lineArray[_.indexOf(legendArray, 'caller_domain')];
      cdr.callerName = lineArray[_.indexOf(legendArray, 'callername')];
      cdr.called = lineArray[_.indexOf(legendArray, 'called')];
      cdr.calledDomain = lineArray[_.indexOf(legendArray, 'called_domain')];
      cdr.lastSipResponseNum = lineArray[_.indexOf(legendArray, 'lastSIPresponseNum')];
      cdr.sensorId = lineArray[_.indexOf(legendArray, 'id_sensor')];
      
// a_mos_f1
// a_mos_f2
// a_mos_adapt
// b_mos_f1
// b_mos_f2
// b_mos_adapt
// a_rtcp_loss
// a_rtcp_maxfr
// a_rtcp_avgfr
// a_rtcp_maxjitter
// a_rtcp_avgjitter
// b_rtcp_loss
// b_rtcp_maxfr
// b_rtcp_avgfr
// b_rtcp_maxjitter
// b_rtcp_avgjitter
// jitter
// mos_min
// a_mos_min
// b_mos_min
// packet_loss_perc
// a_packet_loss_perc
// b_packet_loss_perc
// delay_sum
// a_delay_sum
// b_delay_sum
// delay_avg
// a_delay_avg
// b_delay_avg

      //console.log('xxxx:', cdr.callId);
 
      cdrArray.push(cdr);
    }
    else {
      console.log('data mismatch', legendArray.length, "!=", lineArray.length);
      process.exit();
    }
  }
  //console.log('Line: ' + temp);
  //console.log(legendArray);
}



async.series({
  readInData: function(callback) {
    var input = fs.createReadStream(filename);
    readLines(input, func, callback);
  },
  processData: function(callback) {
    //console.log('Inside processData function');
    //console.log(callIdArray);

    var previousCallId = '';
    var duplicates = 0;
    var duplicateCallIdArray = [];

    var sortedList = _.sortBy(cdrArray, 'callId');

    for (var i = 0; i < sortedList.length; ++i) {
      if (i > 0) {
        if (sortedList[i].callId === previousCallId) {
          ++duplicates;
          duplicateCallIdArray.push(sortedList[i].callId);
          console.log(previousCallId);
        }
      }
      previousCallId = sortedList[i].callId;
    }

    console.log('Duplicates:', duplicates);

    duplicateCdrArray = [];
    for (i = 0; i < sortedList.length; ++i) {
      if (_.indexOf(duplicateCallIdArray, sortedList[i].callId) != -1) {
        duplicateCdrArray.push(sortedList[i]);
      }
    }
    console.log('Duplicate array:', duplicateCdrArray);

    callback(null, "blah");
  }
},
function(err, results) {
  console.log(results);
});




/*
// print process.argv
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});
*/



/*

if ARGV.length == 1
  filename = ARGV[0]
else
  puts 'usage: app.rb <filename>'
  exit
end

lines = IO.readlines(filename)

lineCount = 0
legendArray = Array.new

lines.each() { |line|
  line.chomp!

  if (lineCount == 0)
    legendArray = line.split(',')

    # discard spurious "GeoPosition"
    legendArray.delete_at(legendArray.length - 1)

    legendArray.each { |token|
      puts('*** ' + token)
    }
  else
    # get rid of trailing comma
    line.chop!

    cdrArray = line.split(',')

    if (legendArray.length == cdrArray.length)
      cdrArray.each_index { |index|
        puts(legendArray[index] + ' ' + cdrArray[index])
      }
    else
      puts 'record discarded'
      puts line
    end
  end

  lineCount += 1
}
*/
