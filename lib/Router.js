var React = require('react');
var merge = require('react/lib/merge');
var invariant = require('react/lib/invariant');
var Route = require('./Route');
var History = require('./history/History');
var Request = require('./Request');
var Unhandled = require('./errors/Unhandled');
var once = require('once');
var delayed = require('./utils/delayed');
var parseDispatchArgs = require('./parseDispatchArgs');
var getDefaultHistory = require('./history/getHistory');
var invokeHandlers = require('./utils/invokeHandlers');
var Renderer = require('./Renderer');

function noop() {}

var PropTypes = React.PropTypes;

function Router(opts) {
  this.routes = [];
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

  setStateStore: function(stateStore) {
    this.stateStore = stateStore;

    // Exhaust the pending state ops queue.
    for (var i = 0, len = this._pendingStateOps.length; i < len; i++) {
      var op = this._pendingStateOps[i];
      stateStore.set(op.state, function() {
        this.state = stateStore.get();
        op.cb();
      }.bind(this));
    }
    this._pendingStateOps = null;
  },

  setState: function(state, cb) {
    if (!cb) cb = noop;
    if (this.stateStore) {
      this.stateStore.set(state, function() {
        this.state = this.stateStore.get();
        cb();
      }.bind(this));
    } else {
      var pendingOp = {state: state, cb: cb};
      this._pendingStateOps.push(pendingOp);
      delay(function() {
        if (this._pendingStateOps && this._pendingStateOps[0] === pendingOp) {
          this._pendingStateOps.shift();
          this.state = merge(this.state, pendingOp.state);
          pendingOp.cb();
        }
      }.bind(this));
    }
  },

  /**
   *
   * @param {string} url
   * @param {function?} callback
   */
  dispatch: function(url, callback) {
    // TODO: Handle this better.
    if (url.indexOf(rootURL) === 0) {
      url = url.substr(rootURL.length);
    } else {
      throw new Error('URL not within root: ' + url);
    }

    // Wrap the callback, imposing a delay to force asynchronousness in
    // case the user calls it synchronously.
    var cb = once(delayed(function(err) {
      if (callback)
        callback(err, err ? null : req);
    }));

    var req = new Request(url)
      .on('error', cb)
      .on('end', cb);
    var res = new Response(req, this);

    for (var i = 0, len = this.routes.length; i < len; i++) {
      var route = this.routes[i];
      var match = route.match(req.path);

      if (!match) continue;

      req.params = match;
      invokeHandlers(route.handlers, req, res, cb);

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
    var renderer;
    var history = opts.history || getDefaultHistory();
    var pendingRequest;

    var rerender = function() {
      if (renderer) {
        renderer.setProps({view: req.view, state: req.state});
      }
    };

    var createCleanup = function(req) {
      var cleanup = function() {
        req
          .off('endInitial', initApp)
          .off('end', cleanup)
          .off('error', cleanup);
      };
      return cleanup;
    };

    var initApp = function() {
      renderer = React.renderComponent(
        Renderer({view: this.state.view, viewProps: this.state.viewProps}),
        element
      );

      this.setStateStore({
        set: function(state, cb) {
          renderer.setProps(state, cb);
        },
        get: function() {
          return renderer.props;
        }
      });

      history.on('change', function() {
        update();
      });
    }.bind(this);

    var update = function(isInitial) {
      if (pendingRequest) {
        pendingRequest.cancel();
      }

      pendingRequest = this.dispatch(history.currentURL()).request;
      var cleanup = createCleanup(pendingRequest);
      pendingRequest
        .on('end', cleanup)
        .on('error', cleanup);

      if (isInitial) {
        pendingRequest.once('endInitial', initApp);
      }
    }.bind(this);

    // Start the process.
    update(true);
  }

};

Router.create = function(opts) {
  return new Router(opts);
};

module.exports = Router;
