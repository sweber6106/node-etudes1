#!/usr/bin/env node

//*********************
// operation of trim()
//*********************

var stuff = 'blah\n';

console.log();
console.log('>' + stuff + '<');

stuff = stuff.trim();

console.log('>' + stuff + '<');



//********************************
// length of an empty string is 0
//********************************

var blah = '';

console.log();
console.log('length of blah ... ' + blah.length);



//********************************************************************
// substring does not include the character at the end index position
//********************************************************************

var splarf1 = '0123456789';

var sub1 = splarf1.substring(0, 4);

console.log();
console.log('0123456789.substring(0, 4) ....', sub1);



//*****************************************************************
// getting the last character in the string requires specifying an
// index past the end of the string.
//*****************************************************************

var splarf2 = '0123456789';

var sub2 = splarf2.substring(7, 10);

console.log();
console.log('0123456789.substring(7, 10) ...', sub2);



//****************
// string replace 
//****************

var stringWithReturns = "Blah\nBlarg\nStuff\nSplarf\n";

var filtered2 = stringWithReturns.replace(/\n/g, '');

console.log();
console.log('filtered2: >' + filtered2 + '<');



//***************
// 
//***************

var splarf3 = '1234{5678';

var index3;

index3 = splarf3.indexOf('9');

if (index3 !== -1) {
  console.log();
  console.log('Unexpected');
}

index3 = splarf3.indexOf('{');

if (index3 !== -1) {
  var result3 = splarf3.substring(index3);
  console.log();
  console.log('Fragment:', result3);
}

console.log();
