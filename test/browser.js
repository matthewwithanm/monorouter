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

    it('creates routes from the arguments', function() {
      var Router = ReactRouting.createRouterClass(
        {name: 'a', path: 'a', handler: noop},
        {name: 'b', path: 'b', handler: noop}
      );
      assert.equal(Router.routes.length, 2);
      Router.routes.forEach(function(route) {
        assert.instanceOf(route, Route);
      });
    });

  });

  describe('Router', function() {

    it('matches routes', function(done) {
      var Router = ReactRouting.createRouterClass();
      Router.route('animals/:type', function(req) {
        assert.equal(req.params.type, 'dog');
        done();
      });
      var router = new Router({path: '/animals/dog', view: dummy});
      React.renderComponentToString(router);
    });

  });
});
