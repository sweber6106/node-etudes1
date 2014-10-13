#!/usr/bin/env node

// "npm install joi"
//
// https://github.com/hapijs/joi#objectwithoutkey-peers
//
// This script demonstrates the basics of using Joi for input validation.  A schema object
// is created with the desired rules to which the objects to be validated must conform.  If
// an object fails this validation, an error is passed to the callback indicating which
// rule was violated.

var Joi = require('joi');

var schema = Joi.object().keys(
{
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().regex(/[a-zA-Z0-9]{4,30}/),
  access_token: [Joi.string(), Joi.number()],
  birthyear: Joi.number().integer().min(1900).max(2013),
  email: Joi.string().email()
}).with('username', 'birthyear').without('password', 'access_token');

// this record is invalid because it has both a password and an access_token
validateData({
  username: 'imasample',
  password: 'password',
  access_token: 'This is my access token',
  birthyear: 1962,
  email: 'imasample@domain.com'
});

// this record is valid
validateData({
  username: 'jdoe',
  //password: 'password',
  access_token: 27239,
  birthyear: 1962,
  email: 'jdoe@domain.com'
});

// this record is valid
validateData({ username: 'abc', birthyear: 1994 });

// this record is invalid because the password is too short
validateData({
  username: 'hsimpson',
  password: 'doh',
  birthyear: 1960
});

// this record is invalid because the email address is bogus
validateData({
  username:'jsmith',
  birthyear:1950,
  email:'bogusemail'
});

function validateData(data) {
  Joi.validate(data, schema, function (err, value) {
    if (err) {
      console.log('Data is invalid:', err);
    }
    else {
      console.log('Data is valid');
    }
  });
}