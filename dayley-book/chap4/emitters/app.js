#!/usr/bin/env node

// Shows prototypal inheritance
// Note: Event listeners have access to 'this' but other functions do not (see random1())
 
var events = require('events');

function Account() {
  this.balance = 0;

  events.EventEmitter.call(this);

  this.deposit = function(amount) {
    this.balance += amount;
    this.emit('balanceChanged');
  }

  this.withdraw = function(amount) {
    this.balance -= amount;
    this.emit('balanceChanged');
  }
}

Account.prototype.__proto__ = events.EventEmitter.prototype;

function displayBalance() {
  console.log('Account balance, $%d', this.balance);
}

function checkOverdraw() {
  if (this.balance < 0) {
    console.log('Account overdrawn!!!');
  }
}

function checkGoal(acc, goal) {
  if (acc.balance > goal) {
    console.log('Goal acheived!!!');
  }
}

function random1() {
  console.log('random1() balance:', this.balance);
}

var account = new Account();

account.on('balanceChanged', displayBalance);
account.on('balanceChanged', checkOverdraw);

account.on('balanceChanged', function() {
  checkGoal(this, 1000);
});

account.deposit(220);
random1();
account.deposit(220);
account.deposit(600);
account.withdraw(1200);
