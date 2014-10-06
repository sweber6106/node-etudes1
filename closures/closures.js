#!/usr/bin/env node

'use strict';

var data = [];
for (var i = 0; i < 5; i++) {
  var j = i;
  data[j] = function foo() {
    console.log('data[%s] = %s', j, j);
  };
}

// in this case, there is no outer function context to provide closure
data[0](); data[1](); data[2](); data[3](); data[4]();
console.log();

while (data.length) {
  data.pop();
}


for (i = 0; i < 5; i++) {
 (function () {
   var j = i;
   data[j] = function foo() {
     console.log('data[%s] = %s', j, j);
   };
 })();
}

// in this case, the IIFE provides closure
data[0](); data[1](); data[2](); data[3](); data[4]();
console.log();

while (data.length) {
  data.pop();
}



console.log('***********************************');

var blarg;
var fcn;

(function() {
  var baz = 42;

  blarg = function() {
    var value = 27;

    fcn = function() {
      console.log(value);
      console.log(baz);
    };
  };
})();

if (typeof value === 'undefined') {
  console.log('value is undefined ... as expected');
}
else {
  console.log(typeof value);
}

blarg();
fcn();

console.log('***********************************');



// if we don't care about the return value of the IIFE, we
// can use a variety of symbols in front of the IIFE to
// make it a little prettier but still be immediately
// invoked.
for (var i = 0; i < 5; i++) {
  !function () {
    var j = i;
    data[i] = function foo() {
      console.log('data[%s] = %s', j, j);
    };
  }();
}
data[0](); data[1](); data[2](); data[3](); data[4]();
console.log();


while (data.length) {
  data.pop();
}


// strict mode doesn't allow 'with'
// This code, however, works properly
/*
  for (i = 0; i < 5; i++) {
    with ({num: i}) {
      data[i] = function foo() {
        console.log('data[%s] = %s', num, num);
      };
    }
  }
  data[0](); data[1](); data[2](); data[3](); data[4]();
*/


// invocation: node -harmony app.js
//for (i = 0; i < 5; i++) {
//   let num = i;
//   data[i] = function foo() {
//     console.log('data[%s] = %s', num, num);
//   };
//}
//data[0](); data[1](); data[2](); data[3](); data[4]();
