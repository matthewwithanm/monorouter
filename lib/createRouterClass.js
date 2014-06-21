var React = require('react');
var merge = require('react/lib/merge');
var invariant = require('react/lib/invariant');
var Route = require('./Route');


var PropTypes = React.PropTypes;

/**
 * Creates a new router class. Router classes are React component classes which
 * manage the state of another component by giving them props decomposed from
 * paths.
 *
 * @param {*} routes
 */
function createRouterClass(/* ...routes */) {
  var routes = Array.prototype.slice.call(arguments, 0);

  var Router = React.createClass({
    propTypes: {
      component: PropTypes.func.isRequired
    },
    getInitialState: function() {
      return {
        componentProps: {}
      };
    },
    render: function() {
      var componentProps = merge(merge(this.props), this.state.componentProps);
      delete componentProps.component;
      return this.props.component(componentProps);
    }
  });

  /**
   * A list of routes for this router.
   */
  Router.routes = [];

  /**
   * Add a route to the router class. This API can be used in a manner similar
   * to many server-side JS routing libraries—by chainging calls to `route`—
   * however, it's more likely that you'll want to pass your routes to the
   * router class constructor using JSX.
   *
   * This function accepts any of `(route)`, `(path, handler)`, or
   * `(name, path, handler)`.
   */
  Router.route = function() {
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
  };

  for (var i = 0, len = routes.length; i < len; i++) {
    var route = routes[i];
    Router.route(route);
  }

  return Router;
}

module.exports = createRouterClass;
