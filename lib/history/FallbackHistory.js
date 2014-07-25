var inherits = require('inherits');
var EventEmitter = require('wolfy87-eventemitter');
var urllite = require ('urllite');


/**
 * A history interface for browsers that don't support pushState. `navigate`
 * simply triggers a new request to the server while `push` is left
 * unimplemented (since the browser is incapable of updating the history to
 * match a state after the fact).
 */
function FallbackHistory() {}

inherits(FallbackHistory, EventEmitter);

FallbackHistory.prototype.currentURL = function() {
  // Use urllite to pave over IE issues with pathname.
  var parsed = urllite(document.location.href);
  return parsed.pathname + parsed.search + parsed.hash;
};

FallbackHistory.prototype.navigate = function(path) {
  window.location = path;
};

module.exports = FallbackHistory;
