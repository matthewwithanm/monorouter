var monorouter = require('monorouter');
var reactRouting = require('monorouter-react');

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
    require.ensure(['./views/PetList'], function(require) {
      this.render(require('./views/PetList'), {pets: pets});
    }.bind(this));
  })
  .route('pet', '/pet/:name', function(req) {
    require.ensure(['./views/PetDetail'], function(require) {
      this.render(
        require('./views/PetDetail'),
        {petName: findPetName(req.params.name, pets)}
      );
    }.bind(this));
  });
