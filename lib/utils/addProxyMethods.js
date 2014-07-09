/**
 * Adds methods to one object that proxy to another.
 */
function addProxyMethods(target, source, methods) {
  for (var i = 0, len = methods.length; i < len; i++) {
    var method = methods[i];
    target[method] = (function(method) {
      return function() {
        return source[method].apply(source, arguments);
      };
    })(method);
  }
}

module.exports = addProxyMethods;
