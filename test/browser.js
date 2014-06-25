var assert = chai.assert;
var Route = ReactRouting.Route;
var noop = function() {};
var dummy = function() {
  return React.DOM.div();
};


describe('react-routing', function() {
  describe('createRouterClass', function() {

    it('creates a component class', function() {
      var Router = ReactRouting.createRouterClass();
      assert(React.isValidClass(Router));
    });

    it('creates routes', function() {
      var Router = ReactRouting.createRouterClass()
        .route({name: 'a', path: 'a', handler: noop})
        .route({name: 'b', path: 'b', handler: noop});
      assert.equal(Router.routes.length, 2);
      Router.routes.forEach(function(route) {
        assert.instanceOf(route, Route);
      });
    });

  });

  describe('Router', function() {

    it('matches routes', function(done) {
      var Router = ReactRouting.createRouterClass(dummy);
      Router.route('animals/:type', function(req) {
        assert.equal(req.params.type, 'dog');
        done();
      });
      var router = new Router({path: '/animals/dog'});
      React.renderComponentToString(router);
    });

  });
});
