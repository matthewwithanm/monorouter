var React = require('react');
var urllite = require('urllite');
var renderResponseToString = require('./renderResponseToString');
var ServerResponse = require('./ServerResponse');

var connectMiddleware = function() {
  return function(req, res, next) {
    var parsed = urllite(req.url);
    if (parsed.pathname == null) {
      next(new Error('Invalid URL: ' + req.url));
      return;
    }

    var req = new Request(parsed);
    var res = Router.createResponse(req);
    var ctx = new RoutingContext(req, res);

    Router.dispatch(ctx, function(err, rres) {
      var statusCode = rres.status();
      var contentType = rres.contentType(); // Guess from contentType if not present

      res.statusCode = statusCode;
      res.setHeader('Content-Type', contentType);
      res.end(renderResponseToString(rres));
    });
  };
};

module.exports = connectMiddleware;
