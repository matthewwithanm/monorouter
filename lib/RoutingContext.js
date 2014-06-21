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
function RoutingContext(req, router) {
    this.request = req;
    mergeInto(this, req);
    this.router = router;
}

RoutingContext.prototype = merge(Request.prototype);

/**
 * Creates a new version of the provided function that behaves as a no-op if the
 * current request doesn't correspond to this context's request.
 */
function guarded(fn) {
    return function() {
        if (this.router.state.pendingRequest === this.request) {
            return fn.apply(this, arguments);
        }
    };
}

RoutingContext.prototype.setViewProps = guarded(function(props, cb) {
    this.router.setViewProps(props, cb);
});

RoutingContext.prototype.replaceViewProps = guarded(function(props, cb) {
    this.router.replaceViewProps(props, cb);
});

module.exports = RoutingContext;
