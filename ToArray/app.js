#!/usr/bin/env node

stuff = '["box","truck","knife","bike","cat"]';

stuff = stuff.replace('[',"");
stuff = stuff.replace(']',"");
stuff = stuff.replace(/\"/g, "");

stuffArray = stuff.split(',');

console.log(stuffArray);

for (i = 0; i < stuffArray.length; ++i) {
  console.log(stuffArray[i]);
}
