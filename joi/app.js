#!/usr/bin/env node

// "npm install joi"
//
// https://github.com/hapijs/joi#objectwithoutkey-peers

var Joi = require('Joi');


var schema = Joi.object().keys(
{
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/),
  access_token: [Joi.string(), Joi.number()],
  birthyear: Joi.number().integer().min(1900).max(2013),
  email: Joi.string().email()
}).with('username', 'birthyear').without('password', 'access_token');


var example0 = {
  username: 'sweber',
  password: 'password',
  access_token: 'This is my access token',
  birthyear: 1962,
  email: 'sweber@esi-estech.com'
};

var example1 = {
  username: 'sweber',
  //password: 'password',
  access_token: 27239,
  birthyear: 1962,
  email: 'sweber@esi-estech.com'
};

var example2 = { username: 'abc', birthyear: 1994 };

function isValid(data) {
  Joi.validate(data, schema, function (err, value) {
    if (err) {
      console.log('bad data detected', err);
    }
    else {
      console.log('Hurray for valid data');
    }
  });
}

isValid(example0);
isValid(example1);
isValid(example2);

