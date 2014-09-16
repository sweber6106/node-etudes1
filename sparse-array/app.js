#!/usr/bin/env node

// example showing that a sparse array requires all the memory that
// a non-sparse array would.

splargle = [];

splargle[50] = 17;
splargle[51] = 23;

console.log('splargle.length: ', splargle.length);
