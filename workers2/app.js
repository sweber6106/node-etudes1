#! /usr/bin/env node

//
// Shows how to pass information to worker processes.
//

'use strict';

var cluster  = require('cluster');

console.log('incoming arguments:', process.argv);

(function startup() {
  if (cluster.isMaster) {
    doMasterProcess();
  }

  if (cluster.isWorker) {
    doWorkerProcess();
  }
})();

function doMasterProcess() {
  console.log('node cluster startup master process');
  console.log('pid', process.pid);

  cluster.setupMaster({
    exec : "app.js",
    args : ["--use", "caution"],
    silent : false 
  });

  console.log('master cluster.settings', cluster.settings);

  for (var i = 0; i < 3; i++) {
    cluster.fork();
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
      cluster.fork();
    }, 3000);
  });
}

function doWorkerProcess() {
  console.log('cluster startup worker process');
  console.log('cluster.worker.id', cluster.worker.id);
}
