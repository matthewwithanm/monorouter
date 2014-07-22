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
function renderInto(router, element, opts) {
  if (!opts) opts = {};
  var history = opts.history || getDefaultHistory();

  var createCleanup = function(res) {
    var cleanup = function() {
      res
        .off('initialReady', onInitialReady)
        .off('end', cleanup)
        .off('error', cleanup)
        .request
          .off('cancel', cleanup);
    }.bind(this);
    return cleanup;
  }.bind(this);

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

    var res = router.dispatch(url);

    if (isInitial) {
      var cleanup = createCleanup(res);
      res
        .once('initialReady', onInitialReady)
        .once('end', cleanup)
        .once('error', cleanup)
        .request
          .once('cancel', cleanup);
    }
  };

  // Start the process.
  update(true);
}

module.exports = renderInto;
