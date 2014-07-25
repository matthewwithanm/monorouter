var inherits = require('inherits');
var EventEmitter = require('wolfy87-eventemitter');
var urllite = require ('urllite');
var win = typeof window !== 'undefined' ? window : null;
var history = win && win.history;
var History;


if (history && history.pushState) {
  History = function() {
    win.addEventListener('popstate', function(event) {
      this.emit('change');
    }.bind(this));
  };
} else {
  History = function() {};
}

inherits(History, EventEmitter);

History.prototype.currentURL = function() {
  // Use urllite to pave over IE issues with pathname.
  var parsed = urllite(document.location.href);
  return parsed.pathname + parsed.search + parsed.hash;
};

if (history && history.pushState) {
  History.prototype.navigate = function(path) {
    history.pushState({}, '', path);
    this.emit('change');
  };

  History.prototype.push = function(path) {
    history.pushState({}, '', path);
  };
} else {
  History.prototype.navigate = function(path) {
    window.location = path;
  };
}

module.exports = History;
