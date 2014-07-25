var initError = require('./initError');

function Unhandled(request, msg) {
  if (!msg) msg = 'Path not found: ' + request.path;
  initError(this, 'Unhandled', msg);
  this.request = request;
}

Unhandled.prototype = Error.prototype;

module.exports = Unhandled;
