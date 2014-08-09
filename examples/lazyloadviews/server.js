var express = require('express');
var routerMiddleware = require('connect-monorouter');
var Router = require('./router');
var path = require('path');

port = process.env.PORT || 5000;

express()
  .use('/assets', express.static(__dirname + '/assets'))
  .use(routerMiddleware(Router))
  .listen(port, function() {
    console.log("Listening on " + port + ".");
    console.log("Go to <http://localhost:" + port + "> in your browser.");
  });
