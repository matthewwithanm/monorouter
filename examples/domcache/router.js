var monorouter = require('monorouter');
var reactRouting = require('monorouter-react');
var PetList = require('./views/PetList');
var PetDetail = require('./views/PetDetail');

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

module.exports = monorouter()
  .setup(reactRouting())
  .route('index', '/', function(req) {
    this.domCache('petData', fetchPetList, function (err, data) {
      this.render(PetList, {pets: data});
    });
  })
  .route('pet', '/pet/:name', function(req) {
    this.domCache('petData', fetchPetList, function (err, data) {
      this.render(PetDetail, {petName: findPetName(req.params.name, data)});
    });
  });
