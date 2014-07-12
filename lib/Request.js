var ViewState = require('./ViewState');
var Unhandled = require('./errors/Unhandled');
var addProxyMethods = require('./utils/addProxyMethods');
var queryString = require('query-string');
var urllite = require('urllite');
var Cancel = require('./errors/Cancel');
var EventEmitter = require('EventEmitter2').EventEmitter2;
var inherits = require('inherits');
require('urllite/lib/extensions/toString');


/**
 * An object representing the request to be routed. This object is meant to be
 * familiar to users of server libraries like Express and koa.
 */
function Request(url, params, callback, router) {
  parsed = urllite(url);
  this.location = parsed;
  this.url = urllite.URL.prototype.toString.call(parsed);
  this.path = parsed.pathname;
  this.protocol = parsed.protocol.replace(/:$/, '');
  this.hostname = parsed.hostname;
  this.host = parsed.host;
  this.search = parsed.search;
  this.querystring = parsed.search.replace(/^\?/, '');
  this.query = queryString.parse(parsed.search);
  this.hash = parsed.hash;
  this.fragment = parsed.hash.replace(/^#/, '');
  this.params = params;
  this._callback = callback;
  this._canceledCallbacks = [];
  var viewState = router || new ViewState();
  addProxyMethods(this, viewState, ['setView', 'setViewProps'], true);
  addProxyMethods(this, viewState, ['getViewProps', 'renderView']);
}

// Make requests event emitters.
inherits(Request, EventEmitter);

/**
 * Get a specific param by name or index.
 *
 * @param {number|string} The index or name of the param.
 * @return {object} The matched variables
 */
Request.prototype.param = function(indexOrName) {
  return this.params[indexOrName];
};

// TODO: Update these docs!

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
Request.prototype.unhandled = function() {
  this._callback(new Unhandled(this));
};

Request.prototype.cancel = function() {
  this._canceled = true;
  this._callback(new Cancel(this));
};

/**
 * Indicate that no view was found for the corresponding request. This has no
 * effect in the browser, but causes a 404 response to be sent on the server.
 * Note that this is different from `unhandled` as it indicates that the UI has
 * been updated.
 */
Request.prototype.notFound = function() {
  // TODO: Should this work as a getter too? Or should we make it chainable?
  this._notFound = true;
};

Request.prototype.doctype = function() {
  return ''; // TODO: THIS!
};

Request.prototype.contentType = function() {
  return ''; // TODO: THIS, ALSO!
};

// FIXME: Is it a good idea for this to pull double duty (add callback and get boolean)?
Request.prototype.canceled = function(cb) {
  if (cb) {
    var index = this._canceledCallbacks.indexOf(cb);
    if (index === -1)
      this._canceledCallbacks.push(cb);
  }
  return this._canceled;
};

Request.prototype.end = function() {
  this._callback();
};

module.exports = Request;
