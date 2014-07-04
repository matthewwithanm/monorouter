/**
 * Creates a delayed version of the provided function. This is used to guarantee
 * ansynchronous behavior for potentially synchronous operations.
 */
function delayed(fn) {
  return function() {
    var args = arguments;
    var self = this;
    var fnWithArgs = function() {
      return fn.apply(self, args);
    };
    setTimeout(fnWithArgs, 0);
  };
};

module.exports = delayed;
