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
    // NOTE: Because we're calling `this.renderInitial()`, we lose the
    // opportunity to have the server send a 404, and the client will have to
    // display a 'missing' view. If you want the server to send 404s, you have
    // to call `this.unhandled()` before `this.renderInitial()`.
    this.renderInitial(Preloader, function() {
      // Artificially make the next render take a while.
      setTimeout(function() {
        this.render(PetDetail, {petName: req.params.name});
      }.bind(this), 1000);
    });
  });
