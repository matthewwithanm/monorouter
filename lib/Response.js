var ViewState = require('./ViewState');
var Unhandled = require('./errors/Unhandled');
var addProxyMethods = require('./utils/addProxyMethods');


VIEW_METHODS = ['setView', 'getViewProps', 'setViewProps', 'renderView'];

function Response(request, callback, router) {
  this.request = request;
  this._callback = callback;
  addProxyMethods(this, router || new ViewState(), VIEW_METHODS);
}

/**
 * A shortcut for invoking the callback with an `Unhandled` error in your route
 * handler. Instead of this:
 *
 *     Router.route('users/:username', function() {
 *       if (this.params.username === 'Matthew') {
 *         // Do stuff
 *       } else {
 *         throw new Router.Unhandled(this.request);
 *       }
 *    });
 *
 * or (the async version)
 *
 *     Router.route('users/:username', function(done) {
 *       if (this.params.username === 'Matthew') {
 *         // Do stuff
 *       } else {
 *         done(new Router.Unhandled(this.request));
 *       }
 *    });
 *
 * You can just do this:
 *
 *     Router.route('users/:username', function() {
 *       if (this.params.username === 'Matthew') {
 *         // Do stuff
 *       } else {
 *         this.unhandled();
 *       }
 *    });
 */
Response.prototype.unhandled = function() {
  this._callback(new Unhandled(this.request));
};

module.exports = Response;
