function initError(error, name, msg) {
  var source = new Error(msg);
  error.name = source.name = name;
  error.message = source.message;

  if (source.stack) {
    error.stack = source.stack;
  }

  error.toString = function() {
    return this.name + ': ' + this.message;
  }
};

module.exports = initError;
