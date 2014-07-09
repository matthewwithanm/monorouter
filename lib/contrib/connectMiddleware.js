var React = require('react');
var urllite = require('urllite');
var renderResponseToString = require('../renderResponseToString');


var connectMiddleware = function(Router) {
  return function(req, res, next) {
    // Get the part of the URL we care about.
    // TODO: Allow this to be mounted at a different base and strip that from pathname
    var parsed = urllite(req.url);
    var url = parsed.pathname + parsed.search + parsed.hash;

    Router.dispatch(url, function(err, rres) {
      if (err) {
        // The React router doesn't want to handle it. That's okay, let
        // something else.
        if (err.name === 'Unhandled') return next();

        // Uh oh. A real error.
        return next(err);
      }

      var contentType = rres.contentType(); // Guess from contentType if not present

      res.statusCode = rres._notFound ? 404 : 200;
      res.setHeader('Content-Type', contentType);
      res.end(renderResponseToString(rres));
    });
  };
};

module.exports = connectMiddleware;
