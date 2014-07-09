var initError = require('./initError');

function Cancel(request) {
  initError(this, 'Cancel', 'Request was canceled: ' + request.path);
  this.request = request;
}

Cancel.prototype = Error.prototype;

module.exports = Cancel;
