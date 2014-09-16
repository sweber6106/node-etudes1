#!/usr/bin/env node

// This approach to printing a list does not use closures

var things = ['train', 'car', 'gun', 'ball', 'picture', 'balloon'];

function displayThing(noun, callback) {
  process.nextTick(function() {
    callback(noun);
  });
}

for (var index in things) {
  var thing = things[index];
  
  displayThing(thing, function(noun) {
    console.log('thing:', noun);
  });
}