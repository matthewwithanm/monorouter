var ViewState = require('./ViewState');


VIEW_METHODS = ['setView', 'getViewProps', 'setViewProps', 'renderView'];

function Response(request, router) {
  var target = router || new ViewState();

  // Proxy everything to either the router or ResponseState
  for (var i = 0, len = VIEW_METHODS.length; i < len; i++) {
    var method = VIEW_METHODS[i];
    this[method] = function() {
      return target[method].apply(target, arguments);
    };
  }
}

module.exports = Response;
