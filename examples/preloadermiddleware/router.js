var monorouter = require('monorouter');
var reactRouting = require('monorouter-react');
var PetList = require('./views/PetList');
var PetDetail = require('./views/PetDetail');
var Preloader = require('./views/Preloader');

var pets = [
  {name: 'Winston'},
  {name: 'Chaplin'},
  {name: 'Bennie'}
];

function fetchPetList (cb) {
  // Artificially make the response take a while.
  setTimeout(function() {
    cb(null, pets);
  }, Math.round(200 + Math.random() * 800));
}

function findPetName (petName, data) {
  for (var i = 0; i < pets.length; i++) {
    var pet = data[i];
    if (pet.name.toLowerCase() === petName) return pet.name;
  }
}

function preloadData (req, next) {
  this.renderInitial(Preloader, function() {
    fetchPetList(function(err, data) {
      var viewProps = {pets: data};
      if (req.params && req.params.name)
        viewProps.petName = findPetName(req.params.name, data);
      this.setVars(viewProps);
      next();
    }.bind(this));
  }.bind(this));
}

module.exports = monorouter()
  .setup(reactRouting())
  .route('index', '/', preloadData, function(req) {
    this.render(PetList);
  })
  .route('pet', '/pet/:name', preloadData, function(req) {
    // NOTE: Because renderPreloader renders an initial view, we lose the
    // opportunity to have the server send a 404, and the client will have to
    // display a 'missing' view. If you want the server to send 404s, you have
    // to call `this.unhandled()` before `this.renderInitial()`.
    this.render(PetDetail);
  });
