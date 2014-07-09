var React = require('react');
var merge = require('react/lib/merge');
var invariant = require('react/lib/invariant');
var Route = require('./Route');
var History = require('./history/History');
var Request = require('./Request');
var Response = require('./Response');
var RoutingContext = require('./RoutingContext');
var Unhandled = require('./errors/Unhandled');
var once = require('once');
var delayed = require('./utils/delayed');
var parseDispatchArgs = require('./parseDispatchArgs');
var invokeHandler = require('./utils/invokeHandler');
var getDefaultHistory = require('./history/getHistory');


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
      history: PropTypes.object,
      initialViewProps: PropTypes.object
    },

    getDefaultProps: function() {
      return {
        initialViewProps: {},
        history: null
      };
    },

    getInitialState: function() {
      return {
        viewProps: this.props.initialViewProps || {}
      };
    },

    getHistory: function(props) {
      return (props || this.props).history || getDefaultHistory();
    },

    componentWillReceiveProps: function(nextProps) {
      var oldHistory = this.getHistory();
      var newHistory = this.getHistory(nextProps);
      if (oldHistory !== newHistory) {
        if (oldHistory)
          oldHistory.unregister(this.handleHistoryChange);
        if (newHistory)
          newHistory.register(this.handleHistoryChange);
      }
    },

    handleHistoryChange: function(event) {
      var url = event.location.pathname + event.location.search + event.location.hash;
      this.dispatch(url);
    },

    componentWillMount: function() {
      var history = this.getHistory();
      history.register(this.handleHistoryChange);

      // Dispatch for the initial route.
      this.dispatch(history.currentURL());
    },

    componentWillUnmount: function() {
      this.getHistory().unregister(this.handleHistoryChange);
    },

    render: function() {
      if (!this.state.view) {
        // FIXME: Why do we need this?
        return React.DOM.div();
      }
      return this.state.view(this.state.viewProps);
    },

    dispatch: function(url) {
      // Cancel the currently pending request, if any.
      // React currently (0.10) has a bug (#1740) that prevents us from storing
      // the pending request in state. /:
      if (this.pendingRequest) {
        this.pendingRequest.cancel();
      }

      var req = this.pendingRequest = Router.dispatch(this, url, function(err) {
        this.pendingRequest = null;
        if (err) {
          if (err.name === 'Cancel') {
            // FIXME: Is it a good idea to reach into the request object like this?
            req._canceledCallbacks.forEach(function(cb) {
              cb();
            });
          } else {
            throw err;
          }
        }
      }.bind(this));
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
       * Expose the `Unhandled` error so it can be used in handlers more easily.
       */
      Unhandled: Unhandled,

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
            callback(err, err ? null : res);
        }));

        var req = new Request(url, null, callback);

        for (var i = 0, len = Router.routes.length; i < len; i++) {
          var route = Router.routes[i];
          var match = route.match(req.path);

          if (!match) continue;

          req.params = match;
          var res = new Response(req, cb, router);
          var ctx = new RoutingContext(req, res);
          invokeHandler(route.handler, ctx, cb);
          return req;
        }

        // Uh-oh. Unhandled route!
        cb(new Unhandled(req));
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
