var pathToRegexp = require('./utils/pathToRegexp');


function Route(path) {
  this.path = path;
  this.keys = [];
  this.tokens = [];
  this.regexp = pathToRegexp(path, this.keys, this.tokens, {strict: true});
}

Route.prototype.match = function(url) {
  var match = url.match(this.regexp);
  if (!match) return;
};

Route.prototype.url = function(params) {
  return this.tokens.map(function(token) {
    if (token.literal != null) return token.literal;
    if (token.name) {
      if (params && params[token.name] != null)
        return token.delimiter + params[token.name];
      else if (token.optional)
        return '';
      throw new Error('Missing required param "' + token.name + '"');
    }
  }).join('');
};

module.exports = Route;
