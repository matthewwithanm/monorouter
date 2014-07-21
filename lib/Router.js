var React = require('react');
var merge = require('react/lib/merge');
var Route = require('./Route');
var Request = require('./Request');
var Response = require('./Response');
var Unhandled = require('./errors/Unhandled');
var once = require('once');
var delayed = require('./utils/delayed');
var getDefaultHistory = require('./history/getHistory');
var invokeHandlers = require('./utils/invokeHandlers');
var Renderer = require('./Renderer');
var noop = require('./utils/noop');


function Router(opts) {
  this.routes = [];
  this.state = {};
  this.rootURL = (opts && opts.rootURL || '/');
}

Router.prototype = {

  /**
   * Expose the `Unhandled` error so it can be used in handlers more easily.
   */
  Unhandled: Unhandled,

  /**
   * A list of routes for this router.
   */
  routes: null,

  /**
   * Add a route to the router class. This API can be used in a manner similar
   * to many server-side JS routing libraries—by chainging calls to `route`—
   * however, it's more likely that you'll want to pass your routes to the
   * router class constructor using JSX.
   *
   * This function accepts either `(path, handlers...)`, or
   * `(name, path, handlers...)`.
   */
  route: function() {
    var args = Array.prototype.slice.call(arguments, 0);
    var opts = {};

    if (typeof args[1] !== 'function') {
      opts.name = args.shift();
    }
    opts.path = args.shift();
    opts.handlers = args;

    this.routes.push(new Route(opts));

    // For chaining!
    return this;
  },

  setState: function(state) {
    this.state = merge(this.state, state);
    if (this.renderer)
      this.renderer.setProps({routerState: this.state});
  },

  setView: function(view) {
    this.view = view;
    if (this.renderer)
      this.renderer.setProps({view: this.view});
  },

  /**
   *
   * @param {string} url
   * @param {function?} callback
   */
  dispatch: function(url, opts, callback) {
    if (typeof arguments[1] === 'function') {
      opts = null;
      callback = arguments[1];
    }

    // TODO: Handle this better.
    if (url.indexOf(this.rootURL) === 0) {
      url = url.substr(this.rootURL.length);
    } else {
      throw new Error('URL not within root: ' + url);
    }

    // Wrap the callback, imposing a delay to force asynchronousness in
    // case the user calls it synchronously.
    var cb = once(delayed(function(err) {
      if (callback)
        callback(err, err ? null : req);
    }));

    var req = new Request(url, opts);
    var res = new Response(req, this)
      .on('error', cb)
      .on('end', cb);

    for (var i = 0, len = this.routes.length; i < len; i++) {
      var route = this.routes[i];
      var match = route.match(req.path);

      if (!match) continue;

      req.params = match;

      // Force async behavior so you have a chance to add listeners to the
      // request object.
      delayed(function() {
        invokeHandlers(route.handlers, req, res, cb);
      })();

      return res;
    }

    // Uh-oh. Unhandled route!
    // TODO: Probably need to emit an error so middleware can catch this.
    cb(new Unhandled(req));

    return res;
  },

  renderInto: function(element, opts) {
    if (this.element) {
      throw new Error("You can't render the same router instance into multiple elements.");
    }

    this.element = element;
    if (!opts) opts = {};
    var history = opts.history || getDefaultHistory();

    var rerender = function() {
      if (this.renderer) {
        this.renderer.setProps({view: req.view, routerState: req.state});
      }
    }.bind(this);

    var createCleanup = function(res) {
      var cleanup = function() {
        this._currentResponse = null;
        res
          .off('endInitial', initApp)
          .off('end', cleanup)
          .off('error', cleanup)
          .request
            .off('cancel', cleanup);
      }.bind(this);
      return cleanup;
    }.bind(this);

    var initApp = function() {
      if (!this.view) {
        throw new Error('You must set a view in your route handler');
      }

      this.renderer = React.renderComponent(
        Renderer({view: this.view, routerState: this.state}),
        element
      );

      // Update just in case a navigation happened while we were bootstrapping.
      update();

      history.on('change', function() {
        update();
      });
    }.bind(this);

    var previousURL;
    var update = function(isInitial) {
      var url = history.currentURL();
      if (url === previousURL) return;
      previousURL = url;

      if (this._currentResponse) {
        this._currentResponse.request.cancel();
      }

      this._currentResponse = this.dispatch(url);
      var cleanup = createCleanup(this._currentResponse);
      this._currentResponse
        .on('end', cleanup)
        .on('error', cleanup)
        .request
          .on('cancel', cleanup);

      if (isInitial) {
        this._currentResponse.once('endInitial', initApp);
      }
    }.bind(this);

    // Start the process.
    update(true);
  }

};

module.exports = Router;
