var React = require('react');
var ReactRouting = require('../index');
var DummyHistory = require('../history/DummyHistory');


var Route = ReactRouting.Route;
var Router = ReactRouting.Router;
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

describe('A Router instance', function() {

  it('creates routes', function() {
    var router = new Router()
      .route('a', 'a', noop)
      .route('b', 'b', noop);
    expect(router.routes.length).toBe(2);
    router.routes.forEach(function(route) {
      expect(route instanceof Route).toBeTruthy();
    });
  });

  it('matches routes', function(done) {
    var router = new Router(dummy);
    router.route('animals/:type', function(req) {
      expect(req.params.type).toBe('dog');
      done();
    });
    router.dispatch('/animals/dog', function(err) {
      if (err) done(err);
    });
  });

  it('throws Unhandled errors for…um, unhandled URLs', function(done) {
    var router = new Router();
    router.dispatch('/animals/dog', function(err) {
      expect(err).toBeTruthy();
      expect(err.name).toBe('Unhandled');
      done();
    });
  });

  it('throws Unhandled errors when we explicitly choose not to handle', function(done) {
    var router = new Router();
    router.route('animals/:type', function(req) {
      req.unhandled();
    });
    router.dispatch('/animals/dog', function(err) {
      expect(err).toBeTruthy();
      expect(err.name).toBe('Unhandled');
      done();
    });
  });

  it('cancels pending requests', function(done) {
    var div = document.createElement('div');
    var history = new DummyHistory('/async');
    var router = new Router()
      .route('async', function(req) {
        // We never call `cb` because we're just going to cancel in this test.
        req.on('cancel', function() {
          done();
        });
        this.render(dummy);
      })
      .route('cancelit', function(req) {
        req
          .setView(dummy)
          .end();
      })
      .renderInto(div, {history: history});
    history.push('/cancelit');
  });

});
