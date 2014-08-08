var monorouter = require('monorouter');
var reactRouting = require('monorouter-react');
var PetList = require('./views/PetList');
var PetDetail = require('./views/PetDetail');
var Preloader = require('./views/Preloader');


function renderPreloader (req, next) {
  this.renderInitial(Preloader, function() {
    // Artificially make the next render take a while.
    setTimeout(next, 1000);
  });
}

module.exports = monorouter()
  .setup(reactRouting())
  .route('index', '/', renderPreloader, function(req) {
    this.render(PetList);
  })
  .route('pet', '/pet/:name', renderPreloader, function(req) {
    // NOTE: Because renderPreloader renders an initial view, we lose the
    // opportunity to have the server send a 404, and the client will have to
    // display a 'missing' view. If you want the server to send 404s, you have
    // to call `this.unhandled()` before `this.renderInitial()`.
    this.render(PetDetail, {petName: req.params.name});
  });
