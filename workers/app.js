#! /usr/bin/env node

//
// Shows how to pass information to a worker process.
//
// Note: The value passed using this technique will be a string
//

'use strict';

var cluster = require('cluster');

(function startup() {
  if (cluster.isMaster) {
    doMasterProcess();
  }

  if (cluster.isWorker) {
    doWorkerProcess();
  }
})();

function doMasterProcess() {
  var newWorker;
  var specialWorkerId;

  console.log('node cluster startup master process');
  console.log('pid', process.pid);

  for (var i = 0; i < 2; i++) {
    if (i === 0) {
      newWorker = cluster.fork({ 'bSpecial': true });
      specialWorkerId = newWorker.id;
    }
    else {
      cluster.fork({ 'bSpecial': false });
    }
  }

  cluster.on('exit', function(worker) {
    console.log('node cluster reaped worker id:', worker.id);
    if (worker.suicide === true) {
      console.log('worker id:', worker.id, 'exited');
    }
    else {
      console.log('worker id:', worker.id, 'terminated');
    }
    setTimeout(function() {
      console.log('worker.id:', worker.id, 'specialWorkerId:', specialWorkerId);

      if (worker.id === specialWorkerId) {
        newWorker = cluster.fork({ 'bSpecial': true });
        specialWorkerId = newWorker.id;
      }
      else {
        cluster.fork({ 'bSpecial': false });
      }
    }, 3000);
  });
}

function doWorkerProcess() {
  console.log('worker id:', cluster.worker.id, ', bSpecial:', process.env.bSpecial);

  if (cluster.worker.id === 1) {
    console.log('condition detected');
    process.exit(0);
  }
}
