var React = require('react');
var ReactRouting = require('../index');
var Promise = require('bluebird');
var jasminePit = require('jasmine-pit');


jasminePit.install(window);

var Route = ReactRouting.Route;
var noop = function() {};
var dummy = function(props) {
  return React.DOM.div(null, props.message);
};


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

  pit('matches routes', function() {
    var resolver = Promise.defer();
    var Router = ReactRouting.createRouterClass(dummy);
    Router.route('animals/:type', function() {
      expect(this.params.type).toBe('dog');
      resolver.resolve();
    });
    Router.dispatch('/animals/dog', function(err) {
      if (err) resolver.reject(err);
    });
    return resolver.promise;
  });

  pit('throws Unhandled errors for…um, unhandled URLs', function() {
    var resolver = Promise.defer();
    var Router = ReactRouting.createRouterClass();
    Router.dispatch('/animals/dog', function(err) {
      expect(err).toBeTruthy();
      expect(err.name).toBe('Unhandled');
      resolver.resolve();
    });
    return resolver.promise;
  });

  pit('throws Unhandled errors when we explicitly choose not to handle', function() {
    var resolver = Promise.defer();
    var Router = ReactRouting.createRouterClass();
    Router.route('animals/:type', function() {
      this.unhandled();
    });
    Router.dispatch('/animals/dog', function(err) {
      expect(err).toBeTruthy();
      expect(err.name).toBe('Unhandled');
      resolver.resolve();
    });
    return resolver.promise;
  });

});
