var React = require('react');
var ReactRouting = require('../index');
var Promise = require('bluebird');


var Route = ReactRouting.Route;
var noop = function() {};
var dummy = function(props) {
  return React.DOM.div(null, props.message);
};

// A dumb wrapper around pit to enable the Mocha/Jasmine 2.0 done-style async
// tests.
// TODO: Either we should write this as a standalone module without a dependency
// on pit, or wait for derickbailey/node-jasmine-async#1
function dit(name, test) {
  if (test.length === 1) {
    pit(name, function() {
      var resolver = Promise.defer();
      test(function(err, result) {
        if (err)
          resolver.reject(err);
        else
          resolver.resolve(result);
      });
      return resolver.promise;
    });
  } else {
    it(name, test);
  }
}

describe('createRouterClass', function() {

  it('creates a component class', function() {
    var Router = ReactRouting.createRouterClass();
    expect(React.isValidClass(Router)).toBeTruthy();
  });

  it('creates routes', function() {
    var Router = ReactRouting.createRouterClass()
      .route({name: 'a', path: 'a', handler: noop})
      .route({name: 'b', path: 'b', handler: noop});
    expect(Router.routes.length).toBe(2);
    Router.routes.forEach(function(route) {
      expect(route instanceof Route).toBeTruthy();
    });
  });

});

describe('A Router class', function() {

  dit('matches routes', function(done) {
    var Router = ReactRouting.createRouterClass(dummy);
    Router.route('animals/:type', function() {
      expect(this.params.type).toBe('dog');
      done();
    });
    Router.dispatch('/animals/dog', function(err) {
      if (err) done(err);
    });
  });

  dit('throws Unhandled errors for…um, unhandled URLs', function(done) {
    var Router = ReactRouting.createRouterClass();
    Router.dispatch('/animals/dog', function(err) {
      expect(err).toBeTruthy();
      expect(err.name).toBe('Unhandled');
      done();
    });
    jest.runAllTimers();
  });

  dit('throws Unhandled errors when we explicitly choose not to handle', function(done) {
    var Router = ReactRouting.createRouterClass();
    Router.route('animals/:type', function(done) {
      this.unhandled();
    });
    Router.dispatch('/animals/dog', function(err) {
      expect(err).toBeTruthy();
      expect(err.name).toBe('Unhandled');
      done();
    });
    jest.runAllTimers();
  });

});
