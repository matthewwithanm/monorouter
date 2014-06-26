var urllite = require('urllite');
var Request = require('./Request');

function urlToRequest(urlOrRequest, root) {
  if (typeof urlToRequest === 'object') {
    return urlOrRequest;
  }

  // TODO: Handle this better.
  if (url.indexOf(rootURL) === 0) {
    url = url.substr(url.length);
  } else {
    throw new Error('URL not within root: ' + url);
  }

  return new Request(urllite(url));
}

module.exports = urlToRequest;
