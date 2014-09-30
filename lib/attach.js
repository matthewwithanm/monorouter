var getDefaultHistory = require('./history/getHistory');


/**
 * Bootstraps the app by getting the initial state.
 */
function attach(Router, element, opts) {
  if (!opts) opts = {};
  var history = opts.history || getDefaultHistory();
  var router = new Router({history: history});

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

    var res = router.dispatch(url, function(err) {
      if (err && (err.name !== 'Unhandled') && (err.name !== 'Cancel')) {
        throw err;
      }
    });

    if (isInitial) {
      res.once('initialReady', onInitialReady);
    }
  };

  // Start the process.
  update(true);

  return router;
}

module.exports = attach;
