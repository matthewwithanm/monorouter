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
function Request(url, params, router) {
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
  var viewState = router || new ViewState();
  addProxyMethods(this, viewState, ['setView', 'setViewProps'], true);
  addProxyMethods(this, viewState, ['getViewProps', 'renderView']);
}

// TODO: Rename this? It doesn't really fit with the "end" terminology we're using elsewhere.
/**
 * Indicates that a Request has finished.
 */
Request.prototype.isComplete = false;

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
  this.emit('error', new Unhandled(this));
};

Request.prototype.cancel = function() {
  if (!this._canceled) {
    this._canceled = true;
    this.emit('cancel');
    this.emit('error', new Cancel(this));
  }
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

Request.prototype.canceled = function(cb) {
  return this._canceled;
};

/**
 * Call to indicate that router is in the "initial" state—the state that the
 * server will send and the browser app will begin in.
 */
Request.prototype.endInitial = function() {
  if (this._initialEnded) {
    throw new Error('You can only call endInitial() once per request.');
  }
  this._initialEnded = true;
  this.emit('endInitial');
};

Request.prototype.end = function() {
  if (!this._initialEnded) {
    this.endInitial();
  }
  this.isComplete = true;
  this.emit('end');
};

/**
 * A function decorator that creates a new view from the provided one and the
 * (optional) remaining arguments.
 *
 * @param {function} fn The function whose arguments to transform.
 */
function renderer(fn) {
  return function(view) {
    if (arguments.length > 1) {
      var oldView = view;
      var args = Array.prototype.slice.call(arguments, 1);
      view = function() {
        return oldView.apply(this, args);
      };
    }
    return fn(view);
  };
}

//
// Shortcut methods for rendering a view with props and (optionally) ending the
// request.
//

/**
 * Render the provided view and end the request.
 */
Request.prototype.render = renderer(function(view) {
  this.setView(view);
  this.end();
  return this;
});

/**
 * Render the provided view and mark the current state as the initial one.
 */
Request.prototype.renderInitial = renderer(function(view) {
  this.setView(view);
  this.endInitial();
  return this;
});

/**
 * Render the provided view.
 */
Request.prototype.renderIntermediate = renderer(function(view) {
  this.setView(view);
  return this;
});

module.exports = Request;
