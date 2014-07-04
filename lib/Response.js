var ResponseState = require('./ResponseState');


METHODS = ['setView', 'getViewProps', 'setViewProps', 'renderView'];

function Response(request, router) {
  var target = router || new ResponseState();

  // Proxy everything to either the router or ResponseState
  for (var i = 0, len = METHODS.length; i < len; i++) {
    var method = METHODS[i];
    this[method] = function() {
      return target[method].apply(target, arguments);
    };
  }
};

module.exports = Response;
