var queryString = require('query-string');
var urllite = require('urllite');
var Cancel = require('./errors/Cancel');
require('urllite/lib/extensions/toString');


/**
 * An object representing the request to be routed. This object is meant to be
 * familiar to users of server libraries like Express and koa.
 */
function Request(url, params, callback) {
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
}

/**
 * Get a specific param by name or index.
 *
 * @param {number|string} The index or name of the param.
 * @return {object} The matched variables
 */
Request.prototype.param = function(indexOrName) {
  return this.params[indexOrName];
};

Request.prototype.cancel = function() {
  this._canceled = true;
  this._callback(new Cancel(this));
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

module.exports = Request;
