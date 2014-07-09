var initError = require('./initError');

function Unhandled(request) {
  initError(this, 'Unhandled', 'Path not found: ' + request.path);
  this.request = request;
}

Unhandled.prototype = Error.prototype;

module.exports = Unhandled;
