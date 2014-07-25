var inherits = require('inherits');
var EventEmitter = require('wolfy87-eventemitter');
var urllite = require ('urllite');


/**
 * A history implementation that uses `pushState`.
 */
function PushStateHistory() {
  window.addEventListener('popstate', function(event) {
    this.emit('change');
  }.bind(this));
}

inherits(PushStateHistory, EventEmitter);

PushStateHistory.prototype.currentURL = function() {
  // Use urllite to pave over IE issues with pathname.
  var parsed = urllite(document.location.href);
  return parsed.pathname + parsed.search + parsed.hash;
};

PushStateHistory.prototype.navigate = function(path) {
  window.history.pushState({}, '', path);
  this.emit('change');
};

PushStateHistory.prototype.push = function(path) {
  window.history.pushState({}, '', path);
};

module.exports = PushStateHistory;
