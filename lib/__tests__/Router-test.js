var React = require('react');
var monorouter = require('../index');
var DummyHistory = require('../history/DummyHistory');
var Route = require('../Route');


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
    var router = monorouter()
      .route('a', 'a', noop)
      .route('b', 'b', noop);
    expect(router.routes.length).toBe(2);
    router.routes.forEach(function(route) {
      expect(route instanceof Route).toBeTruthy();
    });
  });

  it('matches routes', function(done) {
    monorouter()
      .route('animals/:type', function(req) {
        expect(req.params.type).toBe('dog');
        done();
      })
      .dispatch('/animals/dog', function(err) {
        if (err) done(err);
      });
  });

  it('throws Unhandled errors for…um, unhandled URLs', function(done) {
    monorouter()
      .dispatch('/animals/dog', function(err) {
        expect(err).toBeTruthy();
        expect(err.name).toBe('Unhandled');
        done();
      });
  });

  it('throws Unhandled errors when we explicitly choose not to handle', function(done) {
    monorouter()
      .route('animals/:type', function(req) {
        req.unhandled();
      })
      .dispatch('/animals/dog', function(err) {
        expect(err).toBeTruthy();
        expect(err.name).toBe('Unhandled');
        done();
      });
  });

  it('cancels pending requests', function(done) {
    var div = document.createElement('div');
    var history = new DummyHistory('/async');
    var router = monorouter()
      .route('async', function(req) {
        req.on('cancel', function(err) {
          done();
        });
        setTimeout(function() {
          this.render(dummy);
        }.bind(this), 0);
      })
      .route('cancelit', function(req) {
        this
          .setView(dummy)
          .end();
      })
      .renderInto(div, {history: history});
    history.push('/cancelit');
  });

});
