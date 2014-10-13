#!/usr/bin/env node

'use strict';

// The following three code snippets all do the same thing.  
// One the third one is approved of by jshint.

!function() {
  console.log('IIFE stands for Immediately-Invoked Function Expression');
} ();

+function() {
  console.log('Another example');
} ();

(function() {
  console.log('Yet another example');
}) ();