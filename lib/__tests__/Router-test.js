var React = require('react');
var monorouter = require('../index');
var DummyHistory = require('../history/DummyHistory');
var Route = require('../Route');
var reactRouting = require('monorouter-react');


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
    var Router = monorouter()
      .route('a', '/a', noop)
      .route('b', '/b', noop);
    expect(Router.middleware.length).toBe(2);
  });

  it('matches routes', function(done) {
    var Router = monorouter()
      .route('/animals/:type', function(req) {
        expect(req.params.type).toBe('dog');
        done();
      });
    Router().dispatch('/animals/dog', function(err) {
      if (err) done(err);
    });
  });

  it('throws Unhandled errors for…um, unhandled URLs', function(done) {
    var Router = monorouter();
    Router()
      .dispatch('/animals/dog', function(err) {
        expect(err).toBeTruthy();
        expect(err.name).toBe('Unhandled');
        done();
      });
  });

  it('throws Unhandled errors when we explicitly choose not to handle', function(done) {
    var Router = monorouter()
      .route('/animals/:type', function(req) {
        this.unhandled();
      });
    Router().dispatch('/animals/dog', function(err) {
        expect(err).toBeTruthy();
        expect(err.name).toBe('Unhandled');
        done();
      });
  });

  it('cancels pending requests', function(done) {
    var div = document.createElement('div');
    var history = new DummyHistory('/async');
    var Router = monorouter()
      .setup(reactRouting())
      .route('/async', function(req) {
        req.on('cancel', function(err) {
          done();
        });
        setTimeout(function() {
          this.render(dummy);
        }.bind(this), 0);
      })
      .route('/cancelit', function(req) {
        this.render(dummy);
      });
    Router.attach(div, {history: history});
    history.push('/cancelit');
  });

  it('Updates the router state', function(done){
    var Router = monorouter()
      .route('/test', function() {
        this.success = true;
        this.render(dummy);
      });
    var router = Router();
    router.dispatch('/test', function(err, res) {
      if (err) return done(err);
      expect(res.success).toBeTruthy();
      done();
    });
  });

  it('invokes the beforeRender hooks in turn', function(done){
    var order = [];
    var Router = monorouter()
      .use(function(req, next) {
        this
          .beforeRender(function(cb) {
            setTimeout(function() {
              order.push(2);
              cb();
            }, 0);
          })
          .beforeRender(function(cb) {
            setTimeout(function() {
              order.push(3);
              cb();
            }, 0);
          });
        next();
      })
      .route('/test', function() {
        order.push(1);
        this.render(dummy);
      });
    var router = Router();
    router.dispatch('/test', function(err, res) {
      if (err) return done(err);
      expect(order).toEqual([1, 2, 3]);
      done();
    });
  });

  it('allows the view to be set without rendering', function(done) {
    var view = function(vars) {
      expect(vars.value).toBe(5);
      done();
      return React.DOM.div();
    };
    var Router = monorouter()
      .use(function(req, next) {
        this.setView(view);
        next();
      })
      .route('/test', function() {
        this.render({value: 5});
      });
    var router = Router();
    router.dispatch('/test', function(err, res) {
      router.render();
    });
  });

  it('allows view and vars to be built up prior to render', function(done) {
    var view = function(vars) {
      expect(vars.value).toBe(5);
      done();
      return React.DOM.div();
    };
    var Router = monorouter()
      .use(function(req, next) {
        this.setView(view);
        next();
      })
      .use(function(req, next) {
        this.setVars({value: 5});
        next();
      })
      .route('/test', function() {
        this.render();
      });
    var router = Router();
    router.dispatch('/test', function(err, res) {
      router.render();
    });
  });

  describe('Error middleware', function() {
    it('is called if middleware passes an error', function(done) {
      var ERR_NAME = 'Test error';
      var Router = monorouter()
        .route('/animals/:type', function(req, next) {
          var err = new Error();
          err.name = ERR_NAME;
          next(err);
        })
        .use(function(req, next) {
          throw new Error('This should not be called!');
        })
        .use(function(err, req, next) {
          expect(err).toBeTruthy();
          expect(err.name).toBe(ERR_NAME);
          done();
        });
      Router().dispatch('/animals/dog', function(err) {
        if (err) done(err);
      });
    });

    it('is called if middleware throws an error', function(done) {
      var ERR_NAME = 'Test error';
      var Router = monorouter()
        .route('/animals/:type', function(req, next) {
          var err = new Error();
          err.name = ERR_NAME;
          throw err;
        })
        .use(function(req, next) {
          throw new Error('This should not be called!');
        })
        .use(function(err, req, next) {
          expect(err).toBeTruthy();
          expect(err.name).toBe(ERR_NAME);
          done();
        });
      Router().dispatch('/animals/dog', function(err) {
        if (err) done(err);
      });
    });

    it('treats not passing the error as an unhandled request', function(done) {
      var Router = monorouter()
        .route('/animals/:type', function(req, next) {
          throw new Error();
        })
        .use(function(err, req, next) {
          // Don't pass along the error.
          next();
        });
      Router().dispatch('/animals/dog', function(err) {
        expect(err && err.name).toBe('Unhandled');
        done();
      });
    });

    it('passes errors down the chain', function(done) {
      var FIRST_ERROR_NAME = 'First';
      var SECOND_ERROR_NAME = 'Second';
      var Router = monorouter()
        .route('/animals/:type', function(req, next) {
          var err = new Error();
          err.name = FIRST_ERROR_NAME;
          throw err;
        })
        .use(function(err, req, next) {
          // Pass along another error.
          expect(err && err.name).toBe(FIRST_ERROR_NAME);
          var err = new Error();
          err.name = SECOND_ERROR_NAME;
          next(err);
        })
        .use(function(err, req, next) {
          // Pass along another error.
          expect(err && err.name).toBe(SECOND_ERROR_NAME);
          done();
        });
      Router().dispatch('/animals/dog');
    });
  });

});
