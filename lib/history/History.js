var win = typeof window !== 'undefined' ? window : null;


var History = function(opts) {
  if (!(this instanceof History)) {
    return new History(opts);
  }

  // this.onpop = opts.onpop;
  // this.onpush = opts.onpush
};

History.prototype.current = function() {
  if (!win) {
    throw new Error("You can't get the path on the server.");
  }
  return win.location.pathname + win.location.search + win.location.hash;
};

History.prototype.push = function(path) {
  
};

History.prototype.pop = function() {
  
};

History.prototype.start = function() {
  win.addEventListener('popstate', handler);
};

History.prototype.stop = function() {
  win.removeEventListener('popstate', handler);
};

module.exports = History;
