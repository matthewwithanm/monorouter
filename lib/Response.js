var inherits = require('inherits');
var Unhandled = require('./errors/Unhandled');
var EventEmitter = require('wolfy87-eventemitter');
var extend = require('xtend');
var delayed = require('./utils/delayed');
var parallel = require('run-parallel');
var withoutResults = require('./utils/withoutResults');
var thunkifyAll = require('./utils/thunkifyAll');
var noop = require('./utils/noop');


/**
 * The Response is used as the `this` value for route functions. It hosts
 * methods for manipulating the server response and application state.
 */
function Response(request, router) {
  this.request = request;
  this.router = router;
  this.state = router.state;
  this.vars = {};
  this._beforeRenderHooks = [];

  request.on('cancel', this['throw'].bind(this));
}

inherits(Response, EventEmitter);

Response.prototype.status = 200;

//
//
// The main methods for manipulating the application state.
//
//

/**
 * A function decorator used to prevent methods from having any effect if the
 * corresponding request has been canceled. This prevents you from having to
 * check if the request was cancled every time you do something async in your
 * handler (however, if you're doing a lot of work, you should do an explicit
 * check and opt out of it).
 */
function unlessCanceled(fn) {
  return function() {
    if (this.request.canceled) return this;
    return fn.apply(this, arguments);
  };
}

/**
 * Update the view vars for any subsequent views rendered by this response.
 */
Response.prototype.setVars = unlessCanceled(function(vars) {
  this.vars = extend(this.vars, vars);
  return this;
});

Response.prototype.setState = unlessCanceled(function(state) {
  this.router.setState(state);
  this.state = this.router.state;
  return this;
});

Response.prototype.setView = unlessCanceled(function(view) {
  this.view = view;
  return this;
});

Response.prototype.beforeRender = function(fn) {
  this._beforeRenderHooks.push(fn);
  return this;
};

//
//
// Ending
//
//

/**
 * Indicates that a response was ended.
 */
Response.prototype.ended = false;
Response.prototype.initialEnded = false;

/**
 * Call to indicate that router is in the "initial" state—the state that the
 * server will send and the browser app will begin in.
 */
Response.prototype.endInitial = function() {
  if (this.initialEnded) {
    return;
  }
  this.initialEnded = true;
  this.emit('initialReady');
  if (this.request.initialOnly) {
    this.end();
  }
  return this.ended;
};

Response.prototype.end = function() {
  if (!this.ended) {
    this.endInitial();
    this.ended = true;
    this.emit('end');
  }
};

/**
 * A method for declaring that the router will not handle the current request.
 * Under normal circumstances, you shouldn't use this method but instead simply
 * call your handler's `done` callback:
 *
 *     Router.route('users/:username', function(req, done) {
 *       if (this.params.username === 'Matthew') {
 *         // Do stuff
 *       } else {
 *         done();
 *       }
 *    });
 *
 * This allows other middleware the opportunity to handle the request.
 *
 * Calling this method is the same as invoking the handler's callback with an
 * `Unhandled` error in your route handler:
 *
 *     Router.route('users/:username', function() {
 *       if (this.params.username === 'Matthew') {
 *         // Do stuff
 *       } else {
 *         throw new Router.Unhandled(this.request);
 *       }
 *    });
 *
 * or (the async version)
 *
 *     Router.route('users/:username', function(done) {
 *       if (this.params.username === 'Matthew') {
 *         // Do stuff
 *       } else {
 *         done(new Router.Unhandled(this.request));
 *       }
 *    });
 */
Response.prototype.unhandled = function(msg) {
  this['throw'](new Unhandled(this.request, msg));
};

Response.prototype['throw'] = function(err) {
  if (!this.error) {
    this.error = err;
    this.emit('error', err);
  }
};

//
//
// Metadata methods.
//
//

/**
 * Indicate that no view was found for the corresponding request. This has no
 * effect in the browser, but causes a 404 response to be sent on the server.
 * Note that this is different from `unhandled` as it indicates that the UI has
 * been updated.
 */
Response.prototype.notFound = function() {
  // TODO: Should this work as a getter too? Or should we make it chainable?
  this.status = 404;
};

Response.prototype.doctype = '<!DOCTYPE html>';
Response.prototype.contentType = 'text/html; charset=utf-8';

//
//
// Rendering shortcuts.
//
//

function bindVars(view, vars) {
  if (vars) {
    var oldView = view;
    return function(extraVars) {
      return oldView.call(this, extend(vars, extraVars));
    };
  }
  return view;
}

/**
 * A function decorator that creates a render function that accepts vars (as a
 * second argument) from one that doesn't.
 *
 * @param {function} fn The function whose arguments to transform.
 */
function renderer(fn) {
  return function() {
    var view, vars, cb, callback;
    var args = Array.prototype.slice.call(arguments, 0);
    if (typeof args[0] === 'function')
      view = args.shift();
    if (typeof args[0] === 'object')
      vars = args.shift();
    cb = args[0];

    var boundRender = function(next) {
      // Pass a partially applied version of the view to the original function.
      vars = extend(this.vars, vars);
      view = bindVars(view || this.view, vars);
      fn.call(this, view, next);
    };

    var hooks = thunkifyAll(this._beforeRenderHooks, this);
    parallel(hooks, function(err) {
      boundRender.call(this, cb || noop);
    }.bind(this));
  };
}

//
// Shortcut methods for rendering a view with props and (optionally) ending the
// request.
//

Response.prototype._renderIntermediate = unlessCanceled(function(view, cb) {
  delayed(function() {
    this.router.setView(view);
    cb.call(this);
  }.bind(this))();
});

/**
 * Render the provided view and end the request.
 */
Response.prototype.render = renderer(function(view, cb) {
  this._renderIntermediate(view, function(err) {
    if (err) {
      cb(err);
      return;
    }
    cb.apply(this,  arguments);
    this.end();
  });
});

/**
 * Render the provided view and mark the current state as the initial one.
 */
Response.prototype.renderInitial = renderer(function(view, cb) {
  this._renderIntermediate(view, function(err) {
    if (err) {
      cb(err);
      return;
    }
    this.endInitial();
    if (!this.request.initialOnly) cb.apply(this,  arguments);
  });
});

/**
 * Render the provided view.
 */
Response.prototype.renderIntermediate = renderer(function(view, cb) {
  this._renderIntermediate(view, cb);
});

Response.prototype.renderDocumentToString = function() {
  var engine = this.router.constructor.engine;
  var markup = engine.renderToString(this.router);
  return (this.doctype || '') + markup;
};

module.exports = Response;
