var inherits = require('inherits');
var BaseHistory = require('./BaseHistory');
var urllite = require ('urllite');


/**
 * A history interface for browsers that don't support pushState.
 */
function FallbackHistory() {}

inherits(FallbackHistory, BaseHistory);

FallbackHistory.prototype.currentURL = function() {
  // If we have our own idea of the URL, use that.
  if (this._url) return this._url;

  // Use urllite to pave over IE issues with pathname.
  var parsed = urllite(document.location.href);
  return parsed.pathname + parsed.search + parsed.hash;
};

FallbackHistory.prototype.push = function(path) {
  // No need to update `this._url`—this code is all going to be reloaded.
  window.location = path;
};

FallbackHistory.prototype.replace = function(path) {
  // For the fallback history, `replace` won't actually change the browser
  // address, but will update its own URL. This is because `replace` usually
  // corresponds to "lesser" state changes: having a stale browser URL is
  // considered more acceptable than refreshing the entire page.
  this._url = path;
  this.emit('update');
};

module.exports = FallbackHistory;
