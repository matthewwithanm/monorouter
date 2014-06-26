var invariant = require('react/lib/invariant');

/**
 * Parses an argument list to `dispatch` or similar, which accept a props object
 * as an optional second param.
 */
function parseDispatchArgs(fn) {
  return function(args) {
    var path = args[0];
    if (typeof args[1] === 'object') {
      props = args[1];
      callback = args[2];
    } else {
      callback = args[1];
    }
    return fn(path, props, callback);
  };
}

module.exports = parseDispatchArgs;
