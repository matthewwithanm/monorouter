var ViewState = require('./ViewState');
var Unhandled = require('./errors/Unhandled');
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
function Request(url, params) {
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
}

// Make requests event emitters.
inherits(Request, EventEmitter);

// TODO: Rename this? It doesn't really fit with the "end" terminology we're using elsewhere.
/**
 * Indicates that a Request has finished.
 */
Request.prototype.isComplete = false;

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

module.exports = Request;
