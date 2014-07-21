var monorouter = require('../../lib');
var App = require('../build/server');

var Router = monorouter.createRouterClass();
Router
  .route({
    name: 'index',
    path: '',
    handler: function() {
      this.setView(App);
    }
  })
  .route({
    name: 'pet',
    path: 'pet/:name',
    handler: function() {
      var petName = this.request.params.name;
      this.setView(function() {
        return App({petName: petName});
      });
    }
  });

module.exports = Router;
