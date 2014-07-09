var express = require('express');
var routerMiddleware = require('../../lib/contrib/connectMiddleware');
var Router = require('./router');

port = process.env.PORT || 5000;

express()
  .use(routerMiddleware(Router))
  .listen(port, function() {
    console.log("Listening on " + port + ".");
    console.log("Go to <http://localhost:" + port + "> in your browser.");
  });
