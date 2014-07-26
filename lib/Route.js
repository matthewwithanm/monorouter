// The Route object is responsible for compiling route patterns and matching
// them against paths. The syntax of route patterns is based on Backbone's,
// though ours tracks param names so they can be used to look up matched values
// later.

var OPTIONAL_PARAM = /\((.*?)\)/g,
  PARAM = /((\(\?)?:(\w+))|(?:\*(\w+))/g,
  ESCAPE_REGEXP = /[\-{}\[\]+?.,\\\^$|#\s]/g;

var Route = function(path) {
  // Allow "newless constructors."
  if (!(this instanceof Route)) {
    return new Route(path);
  }

  if (path == null) {
    throw new Error('You must provide a path for each route.');
  }

  this.compilePath(path);
};

// Convert a route to a RegExp. Lifted from Backbone.
Route.prototype.compilePath = function(path) {
  var addCapture, captureIndex, indexToParam, params, source;

  if (path instanceof RegExp) {
    return (this.regexp = path);
  } else {
    // Since not all browsers support named capture groups, we need to map
    // group indexes to parameter names.
    params = [];
    captureIndex = 1;
    indexToParam = {};
    addCapture = function(param) {
      if (param != null) {
        params.push(param);
        indexToParam[captureIndex] = param;
      }
      return captureIndex += 1;
    };

    source = path
      .replace(ESCAPE_REGEXP, '\\$&')
      .replace(OPTIONAL_PARAM, '(?:$1)?')

      // We need to do all the replacements that contain capture groups in one
      // operation so we can track the order. Otherwise, we wouldn't be able
      // to match them with their names.
      .replace(PARAM, function(match, isNamedParam, namedParamIsOptional, paramName, splatName) {
        if (isNamedParam) {
          if (namedParamIsOptional) {
            return match;
          } else {
            addCapture(paramName);
            return '([^/?]+)';
          }
        } else {
          addCapture(splatName);
          return '([^?]*?)';
        }
      });
    this.regexp = RegExp('^' + source + '(?:\\?(.*))?$');
    this.params = params;
  }
};

// Accepts a path and returns an array containing matches. If a route with named
// patterns was used, the matching values will be added as properties of the
// array using those names.
Route.prototype.match = function(path) {
  var match = path.match(this.regexp);
  if (match) {
    if (this.params) {
      var newMatch = [];
      this.params.forEach(function(param, i) {
        if (param) {
          newMatch[param] = newMatch[i] = match[i + 1];
        }
      });
      return newMatch;
    } else if (match.length) {
      return match;
    }
  }
};


module.exports = Route;
