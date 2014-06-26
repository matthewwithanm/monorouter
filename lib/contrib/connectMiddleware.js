var React = require('react');
var urllite = require('urllite');
var renderResponseToString = require('./renderResponseToString');

var connectMiddleware = function() {
  return function(req, res, next) {
    var parsed = urllite(req.url);
    if (parsed.pathname == null) {
      next(new Error('Invalid URL: ' + req.url));
      return;
    }

    var url = parsed.pathname + parsed.search;
    Router.dispatch(url, function(err, rres) {
      var statusCode = rres.status();
      var contentType = rres.contentType(); // Guess from contentType if not present

      res.statusCode = statusCode;
      res.setHeader('Content-Type', contentType);
      res.end(renderResponsToString(rres));
    });
  };
};

module.exports = connectMiddleware;
