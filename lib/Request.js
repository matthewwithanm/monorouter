var urllite = require('urllite');
require('urllite/lib/extensions/toString');


/**
 * An object representing the request to be routed. This object is meant to be
 * familiar to users of server libraries like Express and koa.
 */
function Request(url, params) {
  this.location = url;
  this.url = urllite.URL.prototype.toString.call(url);
  this.path = url.pathname;
  this.protocol = url.protocol.replace(/:$/, '');
  this.hostname = url.hostname;
  this.host = url.host;
  this.search = url.search;
  this.querystring = url.search.replace(/^\?/, '');
  this.query = {}//parseQueryString(url.search);
  this.params = params;
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

module.exports = Request;
