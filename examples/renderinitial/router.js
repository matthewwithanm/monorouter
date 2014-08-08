var monorouter = require('monorouter');
var reactRouting = require('monorouter-react');
var PetList = require('./views/PetList');
var PetDetail = require('./views/PetDetail');
var Preloader = require('./views/Preloader');


module.exports = monorouter()
  .setup(reactRouting())
  .route('index', '/', function(req) {
    this.renderInitial(Preloader, function() {
      // Artificially make the next render take a while.
      setTimeout(function() {
        this.render(PetList);
      }.bind(this), 1000);
    });
  })
  .route('pet', '/pet/:name', function(req) {
    this.renderInitial(Preloader, function() {
      // Artificially make the next render take a while.
      setTimeout(function() {
        this.render(PetDetail, {petName: req.params.name});
      }.bind(this), 1000);
    });
  });
