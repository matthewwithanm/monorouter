var React = require('react');
var merge = require('react/lib/merge');
var invariant = require('react/lib/invariant');
var Route = require('./Route');
var History = require('./history/History');
var Request = require('./Request');
var Response = require('./Response');
var RoutingContext = require('./RoutingContext');
var NotFound = require('./NotFound');
var once = require('once');
var parseDispatchArgs = require('./parseDispatchArgs');


var delayed = function(fn) {
  return function() {
    setTimeout(fn, 0);
  };
};

var PropTypes = React.PropTypes;

/**
 * Creates a new router class. Router classes are React component classes which
 * manage the state of another component (a "view") by giving them props
 * decomposed from paths.
 */
function createRouterClass(opts) {
  var routes = Array.prototype.slice.call(arguments, 0);
  var rootURL = (opts && opts.rootURL || '/');

  var Router = React.createClass({
    propTypes: {
      path: PropTypes.string,
      history: PropTypes.object,
      initialViewProps: PropTypes.object
    },
    getDefaultProps: function() {
      return {
        initialViewProps: {},
        history: new History()
      };
    },
    getInitialState: function() {
      return {
        viewProps: this.props.initialViewProps || {}
      };
    },

    /**
     * Has the router been provided with a path or does it manage its own state?
     */
    isControlled: function() {
      return this.props.path != null;
    },

    componentDidMount: function() {
      if (this.isControlled())
        return;

      var history = this.props.history;

      // Start listening for history changes.
      history.start();

      // Dispatch for the initial route.
      this.dispatch(history.current());
    },
    componentWillMount: function() {
      if (this.isControlled()) {
        this.dispatch(this.props.path);
      }
    },
    render: function() {
      return this.state.view(this.state.viewProps);
    },

    dispatch: function(url, callback) {
      // TODO: Cancel the currently pending request, if any.
      //
      // // React currently (0.10) has a bug (#1740) that prevents us from storing
      // // the pending request in state. /:
      // this.pendingRequest = req;
      Router.dispatch(this, url, callback);
    },

    setView: function(view) {
      this.setState({view: view});
    },

    getViewProps: function() {
      return merge(this.state.viewProps);
    },

    /**
     * Sets the props for the managed view.
     */
    setViewProps: function(props, cb) {
      var newProps = merge(this.state.viewProps, props);
      this.setState({viewProps: newProps}, cb);
    },

    /**
     * Replace the props for the managed view.
     */
    replaceViewProps: function(props, cb) {
      this.setState({viewProps: props}, cb);
    },

    renderView: function() {
      return this.state.view(this.getViewProps());
    },

    statics: {
      /**
       * A list of routes for this router.
       */
      routes: [],

      /**
       * Add a route to the router class. This API can be used in a manner similar
       * to many server-side JS routing libraries—by chainging calls to `route`—
       * however, it's more likely that you'll want to pass your routes to the
       * router class constructor using JSX.
       *
       * This function accepts any of `(route)`, `(path, handler)`, or
       * `(name, path, handler)`.
       */
      route: function() {
        var route, name;
        var args = arguments;

        switch (args.length) {
        case 1:
          // An object was passed; for example:
          //
          //     Router.route({
          //       name: 'animals',
          //       path: 'animals/:type',
          //       handler: myHandler
          //     });
          route = new Route(args[0]);
          break;
        case 2:
          route = new Route({path: args[0], handler: args[1]});
          break;
        case 3:
          route = new Route({name: args[0], path: args[1], handler: args[2]});
          break;
        }

        this.routes.push(route);

        // For chaining!
        return this;
      },

      /**
       *
       * @param {object?} router
       * @param {string} url
       * @param {function?} callback
       */
      dispatch: function(router, url, callback) {
        var args = Array.prototype.slice.call(arguments, 0);
        if (typeof args[0] === 'string') args.unshift(null);
        router = args[0];
        url = args[1];
        callback = args[2];

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
            callback(err);
        }));

        var req = new Request(url);

        for (var i = 0, len = Router.routes.length; i < len; i++) {
          var route = Router.routes[i];
          var match = route.match(req.path);

          if (!match) continue;

          req.params = match;
          var res = new Response(req, router);
          var ctx = new RoutingContext(req, res);

          var handler = route.handler;
          var error;

          // We support a few different handler signatures:
          //
          // * `()`
          //     * No arguments means a synchronous handler. Use `this` to read
          //       request properties and manipulate the response.
          // * `(done)`
          //     * A single argument means the handler is async. A callback is
          //       passed and can be invoked when the navigation is complete.
          //       Use `this` to read request properties and manipulate the
          //       response.
          // * `(req, res)`
          //     * Like the no-argument option, but a Request and Response
          //       object are passed. This is useful if you're handler is pre-
          //       bound, making `this` unsuitable for use reading request
          //       properties and manipulating the response.
          // * `(req, res, done)`
          //     * An async version of the two-argument option.
          var handlerIsAsync;
          try {
            switch (handler.length) {
            case 0:
              handler.call(ctx);
              break;
            case 1:
              handlerIsAsync = true;
              handler.call(ctx, cb);
              break;
            case 2:
              handler.call(ctx, req, res);
              break;
            case 3:
              handlerIsAsync = true;
              handler.call(ctx, req, res, cb);
              break;
            }
          } catch (err) {
            error = err;
          }

          if (!handlerIsAsync || error) {
            // Invoke the callback. (`error` may be null if a synchronous
            // handler was used and didn't error.)
            cb(error);
          }

          return;
        }

        // Uh-oh. Unhandled route!
        cb(new NotFound(req));
      },

      /**
       * Render the final state of the routed URL to a string.
       */
      renderToString: parseDispatchArgs(function(path, props, callback) {
        // TODO: Use Router.dispatch to render to string. Similar to connectMiddleware
      })

    }
  });

  return Router;
}

module.exports = createRouterClass;
