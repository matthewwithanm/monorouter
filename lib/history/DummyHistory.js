var urllite = require('urllite');
var inherits = require('inherits');
var EventEmitter = require('EventEmitter2').EventEmitter2;

function createEntry(path) {
  return {
    state: {},
    location: urllite(path)
  };
}

var DummyHistory = function(initialPath) {
  this.history = [createEntry(initialPath)];
};

// Make DummyHistory an event emitter.
inherits(DummyHistory, EventEmitter);

DummyHistory.prototype.currentURL = function() {
  var current = this.history[this.history.length - 1];
  return current.location.pathname + current.location.search + current.location.hash;
};

DummyHistory.prototype.push = function(path) {
  var entry = createEntry(path);
  this.history.push(entry);
  this.emit('change');
};

DummyHistory.prototype.pop = function() {
  throw new Error('Not Implemented');
};

module.exports = DummyHistory;
