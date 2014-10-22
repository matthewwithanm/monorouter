var queryString = require('query-string');
var urllite = require('urllite');
var Cancel = require('./errors/Cancel');
var EventEmitter = require('wolfy87-eventemitter');
var inherits = require('inherits');
require('urllite/lib/extensions/resolve');


function getUrl(url, root) {
  if (root && root !== '/') {
    var parsedRoot = urllite(root);
    var hostsMatch = !url.host || !parsedRoot.host ||
                     (url.host === parsedRoot.host);
    var inRoot = hostsMatch && url.pathname.indexOf(parsedRoot.pathname) === 0;
    if (inRoot) {
      var resolvedPath = url.pathname.slice(parsedRoot.pathname.length);
      resolvedPath = resolvedPath.charAt(0) === '/' ? resolvedPath : '/' + resolvedPath;
      return resolvedPath + url.search;
    }
    return null;
  }
  return url.pathname + url.search;
}

/**
 * An object representing the request to be routed. This object is meant to be
 * familiar to users of server libraries like Express and koa.
 */
function Request(url, opts) {
  var parsed = urllite(url);

  // Make sure we have the host information.
  if (!parsed.host) {
    if ((typeof document !== 'undefined') && document.location) {
      parsed = parsed.resolve(document.location.href);
    } else {
      throw new Error("You need to dispatch absolute URLs on the server.");
    }
  }

  this.location = parsed;
  this.url = getUrl(parsed, opts && opts.root);
  this.originalUrl = parsed.pathname + parsed.search;
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
  this.first = opts && opts.first;
  this.cause = opts && opts.cause;
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

/**
 * Check whether the request triggered by one of the the specified causes.
 */
Request.prototype.from = function() {
  var causes;
  if (typeof arguments[0] === 'string') causes = arguments;
  else causes = arguments[0];

  if (causes && causes.length) {
    for (var i = 0, len = causes.length; i < len; i++) {
      if (causes[i] === this.cause) return true;
    }
  }
  return false;
};

Request.prototype.cancel = function() {
  if (!this.canceled) {
    this.canceled = true;
    this.emit('cancel', new Cancel(this));
  }
};

Request.prototype.canceled = false;

module.exports = Request;
