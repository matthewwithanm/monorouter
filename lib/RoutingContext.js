var Request = require('./Request');
var merge = require('react/lib/merge');
var mergeInto = require('react/lib/mergeInto');

/**
 * A RoutingContext is an interface to a router that's bound to a specific
 * request. It helps to avoid easy mistakes when dealing with async operations.
 * For example, the following code is BAD:
 *
 *     Router.route('/path', function(ctx, done) {
 *       xhr('http://api.example.com', function() {
 *         ctx.router.setState(...); // subtle bug here.
 *       })
 *     });
 *
 * If the user makes a new request (clicks another link) while the XHR is in
 * progress, we shouldn't set the state in this handler. This could be fixed by
 * always checking `ctx.canceled()`:
 *
 *     Router.route('/path', function(ctx, done) {
 *       xhr('http://api.example.com', function() {
 *         if (!ctx.canceled()) {
 *           ctx.router.setState(...);
 *         }
 *       })
 *     });
 *
 * This is completely valid. However, it's easy to forget boilerplate. So the
 * RoutingContext exposes its own `setState` that handles the check for you:
 *
 *     Router.route('/path', function(ctx, done) {
 *       xhr('http://api.example.com', function() {
 *         ctx.setState(...);
 *       })
 *     });
 *
 * Ah…perfect!
 */
function RoutingContext(req, res) {
  this.request = req;
  this.response = res;
  mergeInto(this, req);
  // TODO: Add all methods from response to this, but bound to response.
}

// Doing this is a little dangerous. If we ever want to mutate the Request
// object, we have to make sure we also mutate this one in the same way. For
// example, `_setParams`.
RoutingContext.prototype = merge(Request.prototype);

// This sucks. It would be better to mutate the request directly and have an
// accessor on RoutingContext but es3.
RoutingContext.prototype._setParams = function(params) {
  this.params = this.request.params = params;
};

module.exports = RoutingContext;
