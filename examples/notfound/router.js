var monorouter = require('monorouter');
var reactRouting = require('monorouter-react');
var PetList = require('./views/PetList');
var PetDetail = require('./views/PetDetail');
var NotFound = require('./views/NotFound');

var pets = [
  {name: 'Winston'},
  {name: 'Chaplin'},
  {name: 'Bennie'}
];

function findPetName (petName, data) {
  for (var i = 0; i < pets.length; i++) {
    var pet = data[i];
    if (pet.name.toLowerCase() === petName) return pet.name;
  }
}

module.exports = monorouter()
  .setup(reactRouting())
  .route('index', '/', function(req) {
    this.render(PetList, {pets: pets});
  })
  .route('pet', '/pet/:name', function(req) {
    var petName = findPetName(req.params.name, pets);
    if (!petName) {
      return this
        .notFound()
        .render(NotFound, {msg: "No pet " + req.params.name + " exists!"});
    }
    this.render(PetDetail, {petName: petName});
  });
