var React = require('react');
var ReactRouting = require('../index');
var DummyHistory = require('../history/DummyHistory');


var Route = ReactRouting.Route;
var noop = function() {};
var dummy = function(props) {
  return React.DOM.div(null, props.message);
};

function renderComponent(component, block) {
  var div = document.createElement('div');
  React.renderComponent(component, div);
  if (block)
    block();
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

  it('matches routes', function(done) {
    var Router = ReactRouting.createRouterClass(dummy);
    Router.route('animals/:type', function(req) {
      expect(req.params.type).toBe('dog');
      done();
    });
    Router.dispatch('/animals/dog', function(err) {
      if (err) done(err);
    });
  });

  it('throws Unhandled errors for…um, unhandled URLs', function(done) {
    var Router = ReactRouting.createRouterClass();
    Router.dispatch('/animals/dog', function(err) {
      expect(err).toBeTruthy();
      expect(err.name).toBe('Unhandled');
      done();
    });
  });

  it('throws Unhandled errors when we explicitly choose not to handle', function(done) {
    var Router = ReactRouting.createRouterClass();
    Router.route('animals/:type', function(req) {
      req.unhandled();
    });
    Router.dispatch('/animals/dog', function(err) {
      expect(err).toBeTruthy();
      expect(err.name).toBe('Unhandled');
      done();
    });
  });

});

describe('A Router instance', function() {

  it('cancels pending requests', function(done) {
    var Router = ReactRouting.createRouterClass()
      .route('async', function(req) {
        // We never call `cb` because we're just going to cancel in this test.
        req.canceled(done);
      })
      .route('cancelit', function(req) {
        req
          .setView(dummy)
          .end();
      });
    var history = new DummyHistory('/async');
    var router = Router({history: history});
    renderComponent(router, function() {
      history.push('/cancelit');
    });
  });

});
