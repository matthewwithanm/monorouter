var express = require('express');
var path = require('path');

port = process.env.PORT || 5000;

express()
  .get('/app.js', function(req, res) {
    res.sendfile(path.join(__dirname, 'built', 'app.js'));
  })
  .get('/', function(req, res) {
    res.sendfile(path.join(__dirname, 'index.html'));
  })
  .listen(port, function() {
    console.log("Listening on " + port + ".");
    console.log("Go to <http://localhost:" + port + "> in your browser.");
  });
