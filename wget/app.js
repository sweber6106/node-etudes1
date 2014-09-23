#!/usr/bin/env node

'use strict';

var wget = require('wgetjs');
var fs = require('fs');

wget({ url: 'http://nodevember.org/about/travel', dest: 'travel_page.html' }, function() {
  console.log('Downloaded site via wget');

  fs.open('travel_page.html',
          'r',
          function(err, handle) {
            if (err) {
              console.log('ERROR: ' + err.code + ' (' + err.message + ') ');
              return;
            }
            var buf = new Buffer(100000);
            fs.read(handle, buf, 0, 100000, null,
                    function(err, length) {
                      if (err) {
                        console.log("ERROR: " + err.code + ' (' + err.message + ')');
                        return;
                      }
                      var text = buf.toString();
                      var lines = text.split('\n');

                      var linesFound = 0;

                      lines.forEach(function(line) {
                        if ((line === 'We are currently establishing group rates for hotels near the venue.') || 
                            (line === 'Please check back soon.')) {
                          ++linesFound;

                          if (linesFound >= 2) {
                            console.log('The site travel page HAS CHANGED.');
                            return;
                          }
                        }
                      });
                      console.log('The site travel page has not changed.');
                    });
          });  
});
