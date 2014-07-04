var assert = chai.assert;
var Route = ReactRouting.Route;
var noop = function() {};
var dummy = function(props) {
  return React.DOM.div(null, props.message);
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
      Router.route('animals/:type', function() {
        assert.equal(this.params.type, 'dog');
        done();
      });
      Router.dispatch('/animals/dog', function(err) {
        if (err) done(err);
      });
    });

  });
});
