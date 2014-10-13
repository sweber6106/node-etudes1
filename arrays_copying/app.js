#!/usr/bin/env node

var array1 = ['one', 'two', 'three'];

var array2 = array1;

console.log();
console.log('array1:', array1);
console.log('array2:', array2);


var obj1 = {};

obj1.stuff = ['car', 'box', 'stick'];

var obj2 = {};

obj2.stuff = obj1.stuff;

console.log();
console.log('obj1:', obj1);
console.log('obj2:', obj2);

obj2.blarg = 42;
obj2.stuff.push('crayon');

console.log();
console.log('obj1:', obj1);
console.log('obj2:', obj2);


var obj3 = {};
obj3.list = ['apple', 'grape', 'cherry'];

var obj4 = {};
obj4.list = [];
for (var i = 0; i < 3; ++i) {
  obj4.list[i] = obj3.list[i];
}

obj4.list.push('pomegranite');

console.log();
console.log('obj3:', obj3);
console.log('obj4:', obj4);
console.log();
