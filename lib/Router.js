var merge = require('react/lib/merge');
var Route = require('./Route');
var Request = require('./Request');
var Response = require('./Response');
var Unhandled = require('./errors/Unhandled');
var once = require('once');
var delayed = require('./utils/delayed');
var getDefaultHistory = require('./history/getHistory');
var invokeHandlers = require('./utils/invokeHandlers');
var noop = require('./utils/noop');
var inherits = require('inherits');
var EventEmitter = require('EventEmitter2').EventEmitter2;


function Router(opts) {
  this.routes = [];
  this.state = {};
  this.rootURL = (opts && opts.rootURL || '/');
}

inherits(Router, EventEmitter);


/**
 * Expose the `Unhandled` error so it can be used in handlers more easily.
 */
Router.prototype.Unhandled = Unhandled;

/**
 * A list of routes for this router.
 */
Router.prototype.routes = null;

/**
 * Add a route to the router class. This API can be used in a manner similar
 * to many server-side JS routing libraries—by chainging calls to `route`—
 * however, it's more likely that you'll want to pass your routes to the
 * router class constructor using JSX.
 *
 * This function accepts either `(path, handlers...)`, or
 * `(name, path, handlers...)`.
 */
Router.prototype.route = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  var opts = {};

  if (typeof args[1] !== 'function') {
    opts.name = args.shift();
  }
  opts.path = args.shift();
  opts.handlers = args;

  this.routes.push(new Route(opts));

  // For chaining!
  return this;
};

Router.prototype.setState = function(state) {
  this.state = merge(this.state, state);
  this.emit('stateChange');
};

Router.prototype.setView = function(view) {
  this.view = view;
  this.emit('viewChange');
};

/**
 *
 * @param {string} url
 * @param {function?} callback
 */
Router.prototype.dispatch = function(url, opts, callback) {
  if (typeof arguments[1] === 'function') {
    callback = arguments[1];
    opts = null;
  }

  // TODO: Handle this better.
  if (url.indexOf(this.rootURL) === 0) {
    url = url.substr(this.rootURL.length);
  } else {
    throw new Error('URL not within root: ' + url);
  }

  // Wrap the callback, imposing a delay to force asynchronousness in
  // case the user calls it synchronously.
  var cb = once(delayed(function(err) {
    this._currentResponse = null;
    if (callback)
      callback(err, err ? null : res);
  }.bind(this)));

  var req = new Request(url, opts);
  var res = new Response(req, this)
    .on('error', cb)
    .on('end', cb);

  if (this._currentResponse) {
    this._currentResponse.request.cancel();
  }
  this._currentResponse = res;

  for (var i = 0, len = this.routes.length; i < len; i++) {
    var route = this.routes[i];
    var match = route.match(req.path);

    if (!match) continue;

    req.params = match;

    // Force async behavior so you have a chance to add listeners to the
    // request object.
    delayed(function() {
      invokeHandlers(route.handlers, req, res, cb);
    })();

    return res;
  }

  // Uh-oh. Unhandled route!
  // TODO: Probably need to emit an error so middleware can catch this.
  cb(new Unhandled(req));

  return res;
};

module.exports = Router;
