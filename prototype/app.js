#!/usr/bin/env node

// Demonstrates how to define an object using function syntax and
// how to extend it using the prototype keyword.  Note that having
// multiple ".prototype" sections for the same object is not permitted.

function Classy(name, description) {
  this.name = name;
  this.description = description;

  this.doStuff = function() { console.log('doStuff inside Classy'); }
}

//Classy.prototype = {
//  splarf: function() {
//            console.log('splarf inside Classy');
//          }
//};

Classy.prototype = {
  splarf: function() {
            console.log('splarf inside Classy');
          },

  blarg: function(first, second) {
           console.log('first parameter to Classy.blarg:', first);
           console.log('second parameter to Classy.blarg:', second);
         }
};

Classy.prototype.fuss = function() { console.log('inside fuss'); }

var classy = new Classy('JavaScript', 'Typeless language');

console.log(classy.name);

classy.doStuff();

classy.splarf();

classy.blarg('transcendent', 'amorphous');

classy.fuss();
