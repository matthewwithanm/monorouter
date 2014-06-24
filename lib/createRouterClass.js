var React = require('react');
var merge = require('react/lib/merge');
var invariant = require('react/lib/invariant');
var Route = require('./Route');
var History = require('./history/History');
var urllite = require('urllite');
var Request = require('./Request');
var RoutingContext = require('./RoutingContext');
var NotFound = require('./NotFound');
var once = require('once');


var PropTypes = React.PropTypes;

/**
 * Creates a new router class. Router classes are React component classes which
 * manage the state of another component (a "view") by giving them props
 * decomposed from paths.
 *
 * @param {*} routes
 */
function createRouterClass(/* ...routes */) {
  var routes = Array.prototype.slice.call(arguments, 0);

  var Router = React.createClass({
    propTypes: {
      rootURL: PropTypes.string,
      path: PropTypes.string,
      history: PropTypes.object,
      view: PropTypes.func.isRequired,
      onDispatch: PropTypes.func,
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
      return this.props.initialViewProps;
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
      return this.props.view(this.state.viewProps);
    },
    dispatch: function(rawURL) {
      if (rawURL.indexOf(this.props.rootURL) === 0) {
        rawURL = rawURL.substr(this.props.rootURL.length);
      } else {
        // TODO: Handle this better.
        throw new Error('URL not within root: ' + rawURL);
      }
      var url = urllite(rawURL);

      var cb = once(function(err) {
        var req = this.state.pendingRequest;
        if (!err && req && req._notFound) {
          // You may not have thrown an error, but you called `notFound()`.
          // SAME DIFF!
          err = new NotFound(req);
        }
        this.setState({pendingRequest: null}, function() {
          if (this.props.onDispatch)
            this.props.onDispatch(err);
        }.bind(this));
      }.bind(this));

      var handled = Router.routes.some(function(route) {
        var match = route.match(url.pathname);
        if (match) {
          // Cancel the currently pending request, if any.
          // TODO: This

          var req = new Request(url, match);
          var ctx = new RoutingContext(req);
          this.setState({pendingRequest: req});
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
            setTimeout(function() {
              cb(error);
            });
          }

          return true;
        }
      }, this);

      if (!handled) {
        // --
      }
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
      if (!this.state.pendingRequest) {
        throw new Error("There's no active request. Did you forget to make your handler asynchronous?");
      }
      this.state.pendingRequest._notFound = true;
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
      }
    }
  });

  for (var i = 0, len = routes.length; i < len; i++) {
    var route = routes[i];
    Router.route(route);
  }

  return Router;
}

module.exports = createRouterClass;
