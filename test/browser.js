var assert = chai.assert;
var noop = function() {};
var Route = ReactRouting.Route;


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
});
