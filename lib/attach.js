var getDefaultHistory = require('./history/getHistory');


/**
 * Bootstraps the app by getting the initial state.
 */
function attach(Router, element, opts) {
  if (!opts) opts = {};
  var router = new Router({defaultVars: {forDOM: true}});
  var history = opts.history || getDefaultHistory();

  var render = function() {
    Router.engine.renderInto(router, element);
  };

  var onInitialReady = function() {
    render();
    router
      .on('viewChange', render)
      .on('stateChange', render);

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

    // TODO: How should we handle an error here? Throw it? Log it?
    var res = router.dispatch(url);

    if (isInitial) {
      res.once('initialReady', onInitialReady);
    }
  };

  // Start the process.
  update(true);

  return router;
}

module.exports = attach;
