/**
 * Adds methods to one object that proxy to another.
 */
function addProxyMethods(target, source, methods, chainable) {
  for (var i = 0, len = methods.length; i < len; i++) {
    var method = methods[i];
    target[method] = (function(method) {
      return function() {
        var result = source[method].apply(source, arguments);
        return chainable ? this : result;
      };
    })(method);
  }
}

module.exports = addProxyMethods;
