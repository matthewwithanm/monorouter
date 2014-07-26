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
  if (path instanceof RegExp) {
    return (this.regexp = path);
  } else {
    var chunks = [];

    // Since not all browsers support named capture groups, we need to map
    // group indexes to parameter names.
    var params = [];
    var captureIndex = 1;
    var indexToParam = {};
    var addCapture = function(param) {
      if (param != null) {
        params.push(param);
        indexToParam[captureIndex] = param;
      }

      // Also add it to our "chunks" list which is used for building the URL.
      chunks.push(function(params) {
        var value = params && params[param];
        if (value == null)
          throw new Error('Could not reverse URL: missing param ' + param);
        return value;
      });

      return captureIndex += 1;
    };

    var addLiteral = function(str) {
      chunks.push(function() {
        return str;
      });
    };

    var index = 0;
    var source = path
      .replace(ESCAPE_REGEXP, '\\$&')
      .replace(OPTIONAL_PARAM, '(?:$1)?');

    source
      // We need to do all the replacements that contain capture groups in one
      // operation so we can track the order. Otherwise, we wouldn't be able
      // to match them with their names.
      .replace(PARAM, function(match, isNamedParam, namedParamIsOptional, paramName, splatName, offset) {
        if (offset !== index) {
          addLiteral(source.slice(index, offset));
          index = offset + match.length;
        }
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

    // Add any unconsumed part of the string to our URL builder.
    if (index !== source.length)
      addLiteral(source.slice(index, source.length));

    this.regexp = RegExp('^' + source + '(?:\\?(.*))?$');
    this.params = params;

    this.url = function(params) {
      var url = '';
      for (var i = 0, len = chunks.length; i < len; i++) {
        url += chunks[i](params);
      }
      return url;
    };
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
