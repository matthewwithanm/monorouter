var monorouter = require('../../lib');
var App = require('./app');
var reactRouting = require('monorouter-react');


module.exports = monorouter()
  .setup(reactRouting())
  .route('index', '/', function(req) {
    this.render(App);
  })
  .route('pet', '/pet/:name', function(req) {
    this.render(App, {petName: req.params.name});
  });
