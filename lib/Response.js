var merge = require('react/lib/merge');
var inherits = require('inherits');
var EventEmitter = require('EventEmitter2').EventEmitter2;

/**
 * The Response is used as the `this` value for route functions. It hosts
 * methods for manipulating the server response and application state.
 */
function Response(request, router) {
  this.request = request;
  this.router = router;
  this.state = router.state;
}

inherits(Response, EventEmitter);

//
//
// The main methods for manipulating the application state.
//
//

Response.prototype.setState = function(state) {
  this.router.setState(state);
  this.state = this.router.state;
};

Response.prototype.setView = function(view) {
  this.router.setView(view);
  this.view = this.router.view;
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

/**
 * Call to indicate that router is in the "initial" state—the state that the
 * server will send and the browser app will begin in.
 */
Response.prototype.endInitial = function() {
  if (this._initialEnded) {
    return;
  }
  this._initialEnded = true;
  this.emit('initialReady');
  if (this.request.initialOnly) {
    this.end();
  }
};

Response.prototype.end = function() {
  if (!this.ended) {
    this.endInitial();
    this.ended = true;
    this.emit('end');
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
  this._notFound = true;
};

Response.prototype.doctype = function() {
  return ''; // TODO: THIS!
};

Response.prototype.contentType = function() {
  return ''; // TODO: THIS, ALSO!
};

//
//
// Rendering shortcuts.
//
//

/**
 * A function decorator that creates a new view from the provided one and the
 * (optional) remaining arguments.
 *
 * @param {function} fn The function whose arguments to transform.
 */
function renderer(fn) {
  return function(view) {
    if (arguments.length > 1) {
      var oldView = view;
      var args = Array.prototype.slice.call(arguments, 1);
      view = function() {
        return oldView.apply(this, args);
      };
    }
    return fn.call(this, view);
  };
}

//
// Shortcut methods for rendering a view with props and (optionally) ending the
// request.
//

/**
 * Render the provided view and end the request.
 */
Response.prototype.render = renderer(function(view) {
  this.setView(view);
  this.end();
  return this;
});

/**
 * Render the provided view and mark the current state as the initial one.
 */
Response.prototype.renderInitial = renderer(function(view) {
  this.setView(view);
  this.request.endInitial();
  return this;
});

/**
 * Render the provided view.
 */
Response.prototype.renderIntermediate = renderer(function(view) {
  this.setView(view);
  return this;
});

module.exports = Response;
