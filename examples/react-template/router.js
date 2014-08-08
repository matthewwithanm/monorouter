var monorouter = require('monorouter');
var reactRouting = require('monorouter-react');
var PetList = require('./templates/PetList');
var PetDetail = require('./templates/PetDetail');


module.exports = monorouter()
  .setup(reactRouting())
  .route('index', '/', function(req) {
    this.render(PetList);
  })
  .route('pet', '/pet/:name', function(req) {
    this.render(PetDetail, {petName: req.params.name});
  });
