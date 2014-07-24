var inherits = require('inherits');
var EventEmitter = require('wolfy87-eventemitter');
var React = require('react');

/**
 * The Response is used as the `this` value for route functions. It hosts
 * methods for manipulating the server response and application state.
 */
function Response(request, router) {
  this.request = request;
  this.router = router;
  this.state = router.state;

  // FIXME: We shouldn't have to do this. Should `unhandled()` be on the response? Or should we have some other way to catch it?
  request.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));
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
  return this;
};

Response.prototype.setView = function(view) {
  this.router.setView(view);
  this.view = this.router.view;
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
});

/**
 * Render the provided view and mark the current state as the initial one.
 */
Response.prototype.renderInitial = renderer(function(view) {
  this.setView(view);
  this.request.endInitial();
  return this.ended;
});

/**
 * Render the provided view.
 */
Response.prototype.renderIntermediate = renderer(function(view) {
  this.setView(view);
});

Response.prototype.renderDocumentToString = function() {
  var markup = React.renderComponentToString(this.router.render());
  var doctype = this.doctype(); // Guess from contentType if not present.
  return (doctype || '') + markup;
};

module.exports = Response;
