var monorouter = require('monorouter');
var reactRouting = require('monorouter-react');
var PetList = require('./views/PetList');
var PetDetail = require('./views/PetDetail');


monorouter()
  .setup(reactRouting())
  .route('index', '/', function(req) {
    this.render(PetList);
  })
  .route('pet', '/pet/:name', function(req) {
    this.render(PetDetail, {petName: req.params.name});
  })
  .attach(document.body)
  .captureClicks();
