#!/usr/bin/env node

'use strict';

// demonstrate five array methods.

// indexOf - This method returns the index of the search term.
//           Returns -1 if search term is not found.

var fruit = ['pear', 'apple', 'grape', 'tomato', 'orange'];

var index = fruit.indexOf('grape');

console.log('Index of grape in fruit array: ' + index);

index = fruit.indexOf('fuss');

console.log('Index of fuss in fruit array: ' + index);


// filter - Creates a new array as element selection
//          criteria is applied to the input array.

var newArray = fruit.filter(function(element) {
  if ((element[0] === 'g') || (element[0] == 't')) {
    return true;
  }
});


// forEach - Calls the supplied function for each 
//           array element.

newArray.forEach(function(element) {
  console.log('newArray element:' + element);
});


// map - Create a new array by applying the provided
//       function to each element of the input array.

var anotherNewArray = fruit.map(function(item, index) {
  return (item + ' at index ' + index);
});

anotherNewArray.forEach(function(item) {
  console.log(item);
});


// reduce - Produces a single value by applying a function to each element
//          of the supplied array.

var accumulator = fruit.reduce(function(previousAccumulator, item, index, array) {
  return (previousAccumulator + ' ' + item.substring(0, 2));
}, 'First two letters:');

console.log('accumulator: ' + accumulator);


// see underscore and lodash for additional collection manipulation capabilities

// demethodizing - This technique is for make a standalone function out of an
//                 object method.  Needs more study.

// Demethodizing the Array method, forEach(),  into a generic "each"
//var each = Function.prototype.call.bind([].forEach);
//
//var nodeList = document.querySelectorAll("p");
//
//each(nodeList,bold);
//
//function bold(node){
//   node.style.fontWeight ="bold";
//} 