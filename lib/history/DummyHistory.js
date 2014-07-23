var inherits = require('inherits');
var EventEmitter = require('EventEmitter2').EventEmitter2;

var DummyHistory = function(initialPath) {
  this.history = [initialPath];
};

// Make DummyHistory an event emitter.
inherits(DummyHistory, EventEmitter);

DummyHistory.prototype.currentURL = function() {
  return this.history[this.history.length - 1];
};

DummyHistory.prototype.push = function(path) {
  this.history.push(path);
  this.emit('change');
};

DummyHistory.prototype.pop = function() {
  throw new Error('Not Implemented');
};

module.exports = DummyHistory;
