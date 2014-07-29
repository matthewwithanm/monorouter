var inherits = require('inherits');
var EventEmitter = require('wolfy87-eventemitter');

var DummyHistory = function(initialPath) {
  this.history = [initialPath];
};

// Make DummyHistory an event emitter.
inherits(DummyHistory, EventEmitter);

DummyHistory.prototype.currentURL = function() {
  return this.history[this.history.length - 1];
};

DummyHistory.prototype.navigate = function(path) {
  this.history.push(path);
  this.emit('change');
};

DummyHistory.prototype.push = function(path) {
  this.history.push(path);
  this.emit('change');
};

DummyHistory.prototype.pop = function() {
  throw new Error('Not Implemented');
};

module.exports = DummyHistory;
