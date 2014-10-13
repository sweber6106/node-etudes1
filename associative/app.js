#!/usr/local/bin/node

/*
var domainHexahedron = {};

var domainNames = ['blarg', 'splarf', 'gack', 'stuff', 'prang'];
var resellerNames = ['larry', 'moe', 'curly', 'ralph', 'bailey'];

for (var i = 0; i < domainNames.length; ++i) {
  var domain = {};

  domain.name = domainNames[i];
  domain.reseller = resellerNames[i];

  domainHexahedron[domainNames[i]] = domain;
}

console.log('domainHexahedron[stuff]:', domainHexahedron['stuff'].reseller);

if (domainHexahedron['clank'] === undefined) {
  console.log('object domainHexahedron[clank] not found');
}
else {
  console.log('unexpected');
}

domainHexahedron['clank'] = 'blarg';

if (domainHexahedron['clank'] === undefined) {
  console.log('unexpected');
}
else {
  console.log('object domainHexahedron[clank] found');
}
*/

var fixedLengthArray = [];

fixedLengthArray.push('first');
fixedLengthArray.push('second');
fixedLengthArray.push('third');
fixedLengthArray.push('fourth');
fixedLengthArray.push('fifth');

if (fixedLengthArray.indexOf('third') === -1) {
  console.log('Unexpectedly found third');
}
else {
  console.log('Found third = correct');
}

fixedLengthArray.push('sixth');

if (fixedLengthArray.length > 5) {
  console.log('removing oldest entry');
  fixedLengthArray.shift();
}

for (var i = 0; i < fixedLengthArray.length; ++i) {
  console.log('fixedLengthArray[' + i + '] = ' + fixedLengthArray[i]);
}
