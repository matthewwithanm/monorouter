var delay = typeof setImmediate === 'function' ? setImmediate : function(fn) {
  setTimeout(fn, 0);
};

/**
 * Creates a delayed version of the provided function. This is used to guarantee
 * ansynchronous behavior for potentially synchronous operations.
 */
function delayed(fn) {
  return function() {
    var args = arguments;
    var self = this;
    var fnWithArgs = function() {
      fn.apply(self, args);
    };
    delay(fnWithArgs);
  };
}

module.exports = delayed;
