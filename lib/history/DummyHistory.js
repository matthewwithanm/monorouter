var urllite = require('urllite');

function createEntry(path) {
  return {
    state: {},
    location: urllite(path)
  };
}

var DummyHistory = function(initialPath) {
  this.history = [];
  this.subscribers = [];
  if (initialPath)
    this.history.push(createEntry(initialPath));
};

DummyHistory.prototype.currentURL = function() {
  var current = this.history[this.history.length - 1];
  return current.location.pathname + current.location.search + current.location.hash;
};

DummyHistory.prototype.push = function(path) {
  var entry = createEntry(path);
  this.history.push(entry);
  this.subscribers.forEach(function(subscriber) {
    subscriber(entry);
  });
};

DummyHistory.prototype.register = function(subscriber) {
  if (this.subscribers.indexOf(subscriber) === -1) {
    this.subscribers.push(subscriber);
  }
};

DummyHistory.prototype.unregister = function(subscriber) {
  var index = this.subscribers.indexOf(subscriber);
  if (index !== -1) {
    this.subscribers.push(subscriber);
  }
};

DummyHistory.prototype.pop = function() {
  throw new Error('Not Implemented');
};

module.exports = DummyHistory;
