#!/usr/bin/env node

/* jshint node: true */
'use strict';

/* jshint -W074 */

//
// publisher.js
//

var redis = require('redis');

var REDIS_URL  = 'localhost';
var REDIS_PORT = 6379;

var client = redis.createClient(REDIS_PORT, REDIS_URL);

client.on('error', function(err) {
  log.error('redis error:', err);
});

/*
client.on("message", function(channel, message) {
  console.log("[" + channel + "] " + message);
});
*/

//var payload = '{"msg-type":"activity","date":"1399647946819","thread-id":"36","query-id":"119","user":"sweber","priv_user":"sweber","host":"localhost","ip":"","cmd":"insert","objects":[{"db":"chaos0","name":"fuzz1","obj_type":"TABLE"}],"query":"insert into fuzz1 (name, description, number) VALUES ( \'Xfyj[x8sXvVP6^lvO\', \'Zira lebmirura tiw maf gunru ajasowulo nihte tac esku ezeroja.\', 1867443954 )"}';

var payloads = [];

payloads.push('{"msg-type":"activity","date":"1399661182700","thread-id":"36","query-id":"110","user":"sweber","priv_user":"sweber","host":"localhost","ip":"","cmd":"insert","objects":[{"db":"chaos0","name":"fuzz1","obj_type":"TABLE"}],"query":"insert into fuzz1 (name, description, number) VALUES ( \"7c8XW%CeO[\", \"Le hop def gok fokge ofrajfas ca rag ge je.\", 1754617206 )"}');

payloads.push('{"msg-type":"activity","date":"1399661182707","thread-id":"36","query-id":"111","user":"sweber","priv_user":"sweber","host":"localhost","ip":"","cmd":"insert","objects":[{"db":"chaos0","name":"fuzz1","obj_type":"TABLE"}],"query":"insert into fuzz1 (name, description, number) VALUES ( \"gH5lRwo]B)U^(6OQOGOj\", \"Ictipbug ocbew nundo du uksera vaci sosmo sum ji mocvop.\", 2504335963 )"}');
payloads.push('{"msg-type":"activity","date":"1399661182710","thread-id":"36","query-id":"112","user":"sweber","priv_user":"sweber","host":"localhost","ip":"","cmd":"insert","objects":[{"db":"chaos0","name":"fuzz1","obj_type":"TABLE"}],"query":"insert into fuzz1 (name, description, number) VALUES ( \"rKQZ8z)HqB63qJrK&C\", \"Savari roub wolo sugusap ezozef lugih jo bewi nocfut tid.\", 1615689932 )"}');

payloads.push('{"msg-type":"activity","date":"1399661182711","thread-id":"36","query-id":"113","user":"sweber","priv_user":"sweber","host":"localhost","ip":"","cmd":"insert","objects":[{"db":"chaos0","name":"fuzz1","obj_type":"TABLE"}],"query":"insert into fuzz1 (name, description, number) VALUES ( \"n^^Btv5l2nf])#\", \"Wuv deit kec gi ofe surujuv neaw azjo kuju job.\", 207463923 )"}');

payloads.push('{"msg-type":"activity","date":"1399661182713","thread-id":"36","query-id":"114","user":"sweber","priv_user":"sweber","host":"localhost","ip":"","cmd":"insert","objects":[{"db":"chaos0","name":"fuzz1","obj_type":"TABLE"}],"query":"insert into fuzz1 (name, description, number) VALUES ( \"IW#Ip5vFMjzVh\", \"Pohosac dehudu pup dul bazfa bof ilidam leggow fiwirub gurzop.\", 3562180598 )"}');

payloads.push('{"msg-type":"activity","date":"1399661182715","thread-id":"36","query-id":"115","user":"sweber","priv_user":"sweber","host":"localhost","ip":"","cmd":"insert","objects":[{"db":"chaos0","name":"fuzz1","obj_type":"TABLE"}],"query":"insert into fuzz1 (name, description, number) VALUES ( \"RGf46927@KLHK\", \"Hu eko kafoviwe ti laade kawrorus fatvocjir cahlihfi od tugribupu.\", 2000714455 )"}');

payloads.push('{"msg-type":"activity","date":"1399661182718","thread-id":"36","query-id":"116","user":"sweber","priv_user":"sweber","host":"localhost","ip":"","cmd":"insert","objects":[{"db":"chaos0","name":"fuzz1","obj_type":"TABLE"}],"query":"insert into fuzz1 (name, description, number) VALUES ( \"n@&lk2UizJ7sl3(UaS4B\", \"Belimiwa lake mo su gejunap ibusu cehob dagdi hommo fited.\", 2406784924 )"}');

payloads.push('{"msg-type":"activity","date":"1399661182719","thread-id":"36","query-id":"117","user":"sweber","priv_user":"sweber","host":"localhost","ip":"","cmd":"insert","objects":[{"db":"chaos0","name":"fuzz1","obj_type":"TABLE"}],"query":"insert into fuzz1 (name, description, number) VALUES ( \"WuCr89hVn&ZhU\", \"An biznab fume wewen pubug seb tu roovoite rakfuce vano.\", 73688250 )"}');

payloads.push('{"msg-type":"activity","date":"1399661182722","thread-id":"36","query-id":"118","user":"sweber","priv_user":"sweber","host":"localhost","ip":"","cmd":"insert","objects":[{"db":"chaos0","name":"fuzz1","obj_type":"TABLE"}],"query":"insert into fuzz1 (name, description, number) VALUES ( \"t^4C7f7(\", \"Nivzu kub ukhivav ekrafab kil bupwag hoom uhwo zos ohlalu.\", 2904499200 )"}');

payloads.push('{"msg-type":"activity","date":"1399661182723","thread-id":"36","query-id":"119","user":"sweber","priv_user":"sweber","host":"localhost","ip":"","cmd":"insert","objects":[{"db":"chaos0","name":"fuzz1","obj_type":"TABLE"}],"query":"insert into fuzz1 (name, description, number) VALUES ( \"ZWXF2[@ruf!bcV3u\", \"Nihe viku natnenfih oragu kevedtip sitaju teniba dijse covacref op.\", 1311396887 )"}');

for (var i = 0; i < payloads.length; ++i) {
  console.log("payloads[" + i + "] = " + payloads[i]);
  client.publish("channel19", payloads[i]);
}

//setInterval(function() {
//  console.log('publishing');
//
//  //client.publish("one.com", "good");
//  //client.publish("two.com", "fair");
//  //client.publish("three.com", "poor");
//
//  client.publish("channel19", payload);
//}, 4000);
