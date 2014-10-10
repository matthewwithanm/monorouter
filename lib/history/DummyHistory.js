var inherits = require('inherits');
var BaseHistory = require('./BaseHistory');


var DummyHistory = function(initialPath) {
  this.history = [initialPath];
};

inherits(DummyHistory, BaseHistory);

DummyHistory.prototype.currentURL = function() {
  return this.history[this.history.length - 1];
};

DummyHistory.prototype.push = function(path) {
  this.history.push(path);
  this.emit('update');
};

DummyHistory.prototype.pop = function() {
  throw new Error('Not Implemented');
};

module.exports = DummyHistory;
