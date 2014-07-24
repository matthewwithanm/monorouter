var getDefaultHistory = require('./history/getHistory');


/**
 * Bootstraps the app by getting the initial state.
 */
function renderInto(Router, element, opts) {
  if (!opts) opts = {};
  var router = new Router();
  var history = opts.history || getDefaultHistory();

  var render = function() {
    Router.engine.renderInto(router.render(), element);
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
      res.off('initialReady', onInitialReady);
    });

    if (isInitial) {
      res.once('initialReady', onInitialReady);
    }
  };

  // Start the process.
  update(true);

  return router;
}

module.exports = renderInto;
