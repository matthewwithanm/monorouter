var React = require('react');
var Renderer = require('./Renderer');
var getDefaultHistory = require('./history/getHistory');

function initApp(router, element, history) {
  if (!router.view) {
    throw new Error('You must set a view in your route handler');
  }

  var renderer = React.renderComponent(
    Renderer({view: router.view, routerState: router.state}),
    element
  );

  var rerender = function() {
    if (renderer) {
      renderer.setProps({view: router.view, routerState: router.state});
    }
  };

  router
    .on('viewChange', rerender)
    .on('stateChange', rerender);
}

/**
 * Bootstraps the app by getting the initial state.
 */
function renderInto(Router, element, opts) {
  if (!opts) opts = {};
  var router = new Router();
  var history = opts.history || getDefaultHistory();

  var onInitialReady = function() {
    initApp(router, element, history);

    // Now that the view has been bootstrapped (i.e. is in its inital state), it
    // can be updated.
    update();
    history.on('change', function() {
      update();
    });
  };

  var previousURL;
  var update = function(isInitial) {
    var url = history.currentURL();
    if (url === previousURL) return;
    previousURL = url;

    var res = router.dispatch(url, function(err) {
      res.off('initialReady', onInitialReady);
    });

    if (isInitial) {
      res.once('initialReady', onInitialReady);
    }
  };

  // Start the process.
  update(true);
}

module.exports = renderInto;
