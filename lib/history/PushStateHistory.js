var inherits = require('inherits');
var BaseHistory = require('./BaseHistory');
var urllite = require ('urllite');


/**
 * A history implementation that uses `pushState`.
 */
function PushStateHistory() {
  window.addEventListener('popstate', function(event) {
    this.emit('update');
  }.bind(this));
}

inherits(PushStateHistory, BaseHistory);

PushStateHistory.prototype.currentURL = function() {
  // Use urllite to pave over IE issues with pathname.
  var parsed = urllite(document.location.href);
  return parsed.pathname + parsed.search + parsed.hash;
};

PushStateHistory.prototype.push = function(path) {
  window.history.pushState({}, '', path);
  this.emit('update');
};

PushStateHistory.prototype.replace = function(path) {
  window.history.replaceState({}, '', path);
  this.emit('update');
};

module.exports = PushStateHistory;
