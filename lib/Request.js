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
function Request(url, opts) {
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
  this.initialOnly = opts && opts.initialOnly;
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
  this.emit('error', new Unhandled(this));
};

Request.prototype.cancel = function() {
  if (!this.canceled) {
    this.canceled = true;
    this.emit('cancel', new Cancel(this));
  }
};

Request.prototype.canceled = false;

module.exports = Request;
