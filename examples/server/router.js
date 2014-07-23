var monorouter = require('../../lib');
var App = require('../build/server');


module.exports = monorouter()
  .route('index', '', function(req) {
    console.log('routing...');
    this.render(App);
  })
  .route('pet', 'pet/:name', function(req) {
    this
      .setView(App)
      .setState({petName: req.params.name})
      .end();
  });
