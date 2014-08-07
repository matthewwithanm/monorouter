var inherits = require('inherits');
var EventEmitter = require('wolfy87-eventemitter');
var urllite = require ('urllite');


/**
 * A history interface for browsers that don't support pushState.
 */
function FallbackHistory() {}

inherits(FallbackHistory, EventEmitter);

FallbackHistory.prototype.currentURL = function() {
  // Use urllite to pave over IE issues with pathname.
  var parsed = urllite(document.location.href);
  return parsed.pathname + parsed.search + parsed.hash;
};

FallbackHistory.prototype.push = function(path) {
  window.location = path;
};

module.exports = FallbackHistory;
