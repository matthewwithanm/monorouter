var React = require('react');
var merge = require('react/lib/merge');
var invariant = require('react/lib/invariant');
var Route = require('./Route');
var History = require('./history/History');
var urllite = require('urllite');
var Request = require('./Request');
var Response = require('./Response');
var RoutingContext = require('./RoutingContext');
var NotFound = require('./NotFound');
var once = require('once');
var parseDispatchArgs = require('./parseDispatchArgs');
var urlToRequest = require('./urlToRequest')

var delay = function(fn) {
  setTimeout(fn, 0);
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
      rootURL: PropTypes.string,
      path: PropTypes.string,
      history: PropTypes.object,
      initialViewProps: PropTypes.object
    },
    getDefaultProps: function() {
      return {
        rootURL: '/',
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
      // TODO: Handle this better.
      if (url.indexOf(rootURL) === 0) {
        url = url.substr(url.length);
      } else {
        throw new Error('URL not within root: ' + url);
      }

      var req = new Request(urllite(url));
      // TODO: Cancel the currently pending request, if any.

      var res = Router.createResponse(this.state.viewProps, router);
      var ctx = new RoutingContext(req, res);

      // React currently (0.10) has a bug (#1740) that prevents us from storing
      // the pending request in state. /:
      this.pendingRequest = req;
      var cb = once(function(err) {
        if (this.pendingRequest === req) {
          this.pendingRequest = null;
        }
        if (err) {
          if (callback)
            callback(err);
          else
            throw err;
        }
      }.bind(this));

      Router.dispatch(ctx, cb);
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

    /**
     * Redirect the request that's currently being processed.
     */
    redirect: function(url) {
      
    },

    /**
     * Mark the currently pending request as not found. This is similar to
     * throwing `NotFound` in your handler (or passing it to the callback in
     * async handlers), but it doesn't stop execution of the function.
     */
    notFound: function() {
      if (!this.pendingRequest) {
        throw new Error("There's no active request. Did you forget to make your handler asynchronous?");
      }
      this.pendingRequest._notFound = true;
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
        var route, name,
          args = Array.prototype.slice.call(arguments, 0);

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

      createResponse: function(request, router) {
        return new Response(request, router);
      },

      dispatch: function(ctx, callback) {
        var handled = Router.routes.some(function(route) {
          var match = route.match(url.pathname);
          if (match) {
            req.params = match;

            // Update the request with the params.
            // TODO: Maybe create a new 
            ctx._setParams(params);

            var handler = route.handler;
            var handlerIsAsync = handler.length === 2;
            var error;
            try {
              if (handlerIsAsync)
                handler.call(ctx, ctx, cb);
              else
                handler.call(ctx, ctx);
            } catch (err) {
              error = err;
            }

            if (!handlerIsAsync || error) {
              // Treat synchronous handlers and sychronous errors in async
              // handlers asynchronously for consistency and predictability.
              delay(function() {
                cb(error);
              });
            }

            return true;
          }
        }, this);

        if (!handled) {
          delay(function() {
            cb(new NotFound(req));
          });
        }


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
