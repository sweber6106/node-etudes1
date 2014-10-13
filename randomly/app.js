#!/usr/local/bin/node

var Chance = require('chance');
var moment = require('moment');

var chance = new Chance(); 

var domains = [];
domains.push("splarf.com");
domains.push("prang.com");
domains.push("schmoud.com");
domains.push("hopenpray.com");

var choice;
var calls;

mosByDomains = [];

for (var i = 0; i < domains.length; ++i) {

  var leaf = {};

  leaf.domain = domains[i];

  choice = chance.integer({min:0, max:2});

  switch (choice) {
    case 0:
      leaf.mos = 'good';
      break;

    case 1:
      leaf.mos = 'fair';
      break;

    case 2:
      leaf.mos = 'poor';
      break;

    default:
      console.log('impossible happened');
      break;
  }

  mosByDomains.push(leaf);
}

var jsonView2 = JSON.stringify(mosByDomains, null, "  ");

var view1 = {};

view1.mosSummary = {};

view1.mosSummary.good = 0;
view1.mosSummary.fair = 0;
view1.mosSummary.poor = 0;

for (var i = 0; i < mosByDomains.length; ++i) {
  switch (mosByDomains[i].mos) {
    case 'good':
      ++view1.mosSummary.good;
      break;

    case 'fair':
      ++view1.mosSummary.fair;
      break;

    case 'poor':
      ++view1.mosSummary.poor;
      break;

    default:
      console.log('impossible happened', mosByDomains[i].mos);
      break;
  }
}

rawData = [];

for (var i = 0; i < domains.length; ++i) {

  domainObj = {};

  domainObj.domain = domains[i];
  domainObj.callsByHour = [];

  for (var j = 0; j < 240; ++j) {
    hourObj = {};

    calls = chance.integer({min: 10, max: 200});

    hourObj.calls = calls;
    hourObj.good = chance.integer({min: 0, max: calls});
    hourObj.fair = chance.integer({min: 0, max: calls - hourObj.good});
    hourObj.poor = calls - hourObj.good - hourObj.fair;

    domainObj.callsByHour.push(hourObj);
  }
  rawData.push(domainObj);
}


view1.last24Hours = [];

for (var i = 0; i < 24; ++i) {
  hourObj = {};

  hourObj.hoursAgo = i;
  hourObj.good = 0;
  hourObj.fair = 0;
  hourObj.poor = 0;

  for (var j = 0; j < domains.length; ++j) {
    hourObj.good += rawData[j].callsByHour[i].good;
    hourObj.fair += rawData[j].callsByHour[i].fair;
    hourObj.poor += rawData[j].callsByHour[i].poor;
  }

  view1.last24Hours.push(hourObj);
}


view1.last10Days = [];

dayObj = {};

dayObj.daysAgo = 0;
dayObj.good = 0;
dayObj.fair = 0;
dayObj.poor = 0;
  
var date = new Date();
var currentHour = date.getHours();

for (var j = 0; j < currentHour; ++j) {
  for (var k = 0; k < domains.length; ++k) {
    dayObj.good += rawData[k].callsByHour[j].good;
    dayObj.fair += rawData[k].callsByHour[j].fair;
    dayObj.poor += rawData[k].callsByHour[j].poor;
  } 
}

view1.last10Days.push(dayObj);

for (var i = 1; i < 10; ++i) {
  dayObj = {};

  dayObj.daysAgo = i;
  dayObj.good = 0;
  dayObj.fair = 0;
  dayObj.poor = 0;
  
  baseHour = currentHour + (24 * (i - 1));

  for (var j = 0; j < 24; ++j) {
    for (var k = 0; k < domains.length; ++k) {
      dayObj.good += rawData[k].callsByHour[baseHour + j].good;
      dayObj.fair += rawData[k].callsByHour[baseHour + j].fair;
      dayObj.poor += rawData[k].callsByHour[baseHour + j].poor;
    } 
  }

  view1.last10Days.push(dayObj);
}

var jsonView1 = JSON.stringify(view1, null, "  ");
console.log('**** Reseller View 1 ****');
console.log();
console.log(jsonView1);
console.log();
console.log('**** Reseller View 2 ****');
console.log();
console.log(jsonView2);


//*******
// Admin 
//*******

callsByHour = [];

for (var i = 0; i < 240; ++i) {
  hourObj = {};

  calls = chance.integer({min: 10, max: 200});

  hourObj.calls = calls;
  hourObj.good = chance.integer({min: 0, max: calls});
  hourObj.fair = chance.integer({min: 0, max: calls - hourObj.good});
  hourObj.poor = calls - hourObj.good - hourObj.fair;

  callsByHour.push(hourObj);
}

var lastHourCalls = [];

for (var i = 0; i < callsByHour[0].calls; ++i) {

  var callObj = {};

  callObj.caller = chance.integer({min: 1000, max: 1999});

  var called = chance.integer({min: 1000, max: 1999});

  while (called === callObj.caller) {
    called = chance.integer({min: 1000, max: 1999});
  }

  callObj.called = called;

  var startSecondsAgo = chance.integer({min: 120, max: 3540});

  var durationSeconds = chance.integer({min: 25, max: startSecondsAgo - 10});

  callObj.duration = moment().startOf('day').seconds(durationSeconds).format('HH:mm:ss').toString();

  var day = moment.utc();

  day.subtract('seconds', startSecondsAgo);
  callObj.date = day.format().substring(0,10);

  choice = chance.integer({min:0, max:2});

  switch (choice) {
    case 0:
      callObj.mos = 'good';
      break;

    case 1:
      callObj.mos = 'fair';
      break;

    case 2:
      callObj.mos = 'poor';
      break;

    default:
      console.log('impossible happened');
      break;
  }
  
  lastHourCalls.push(callObj);
}

// var jsonCallData = JSON.stringify(lastHourCalls, null, "  ");
// console.log(jsonCallData);


adminView1 = {};

adminView1.mosSummary = {};

adminView1.mosSummary.good = 0;
adminView1.mosSummary.fair = 0;
adminView1.mosSummary.poor = 0;

for (var i = 0; i < lastHourCalls.length; ++i) {
  switch (lastHourCalls[i].mos) {
    case 'good':
      ++adminView1.mosSummary.good;
      break;

    case 'fair':
      ++adminView1.mosSummary.fair;
      break;

    case 'poor':
      ++adminView1.mosSummary.poor;
      break;

    default:
      console.log("Impossible happened in lastHourCalls[].mos");
      break;
  }
}

adminView1.last24Hours = [];

for (var i = 0; i < 24; ++i) {
  hourObj = {};

  hourObj.hoursAgo = i;
  hourObj.good = 0;
  hourObj.fair = 0;
  hourObj.poor = 0;

  hourObj.good += callsByHour[i].good;
  hourObj.fair += callsByHour[i].fair;
  hourObj.poor += callsByHour[i].poor;

  adminView1.last24Hours.push(hourObj);
}

adminView1.last10Days = [];

dayObj = {};

dayObj.daysAgo = 0;
dayObj.good = 0;
dayObj.fair = 0;
dayObj.poor = 0;
  
var date2 = new Date();
var currentHour2 = date.getHours();

for (var j = 0; j < currentHour2; ++j) {
  dayObj.good += callsByHour[j].good;
  dayObj.fair += callsByHour[j].fair;
  dayObj.poor += callsByHour[j].poor;
}

adminView1.last10Days.push(dayObj);

for (var i = 1; i < 10; ++i) {
  dayObj = {};

  dayObj.daysAgo = i;
  dayObj.good = 0;
  dayObj.fair = 0;
  dayObj.poor = 0;
  
  var baseHour = currentHour2 + (24 * (i - 1));

  for (var j = 0; j < 24; ++j) {
    dayObj.good += callsByHour[baseHour + j].good;
    dayObj.fair += callsByHour[baseHour + j].fair;
    dayObj.poor += callsByHour[baseHour + j].poor;
  }

  adminView1.last10Days.push(dayObj);
}

console.log("***** Admin View 1 *****");
console.log(JSON.stringify(adminView1, null, "  "));
console.log();
console.log("***** Admin View 2 *****");
console.log(JSON.stringify(lastHourCalls, null, "  "));
