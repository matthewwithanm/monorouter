var extend = require('xtend');
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


function Router() {
  this.state = {};
}

inherits(Router, EventEmitter);


/**
 * Expose the `Unhandled` error so it can be used in handlers more easily.
 */
Router.Unhandled = Unhandled;

/**
 * Add a route to the router class. This API can be used in a manner similar
 * to many server-side JS routing libraries—by chainging calls to `route`—
 * however, it's more likely that you'll want to pass your routes to the
 * router class constructor using JSX.
 *
 * This function accepts either `(path, handlers...)`, or
 * `(name, path, handlers...)`.
 */
Router.route = function() {
  var RouterClass = this;
  var args = Array.prototype.slice.call(arguments, 0);
  var opts = {};

  if (typeof args[1] !== 'function') {
    opts.name = args.shift();
  }
  opts.path = args.shift();
  opts.handlers = args;

  var route = new Route(opts);

  // Create and register a middleware to represent this route.
  RouterClass.use(function(req, next) {
    // Only one route should handle any given request.
    if (req.handled) return next();

    // If this route doesn't match, skip it.
    var match = route.match(req.path);
    if (!match) return next();

    // A match! Mark the request as handled and store the params.
    req.handled = true;
    req.params = match;

    invokeHandlers(opts.handlers, req, this, next);
  });

  // For chaining!
  return this;
};

Router.prototype.setState = function(state) {
  this.state = extend(this.state, state);
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
  var RouterClass = this.constructor;

  if (typeof arguments[1] === 'function') {
    callback = arguments[1];
    opts = null;
  }

  // TODO: Handle this better.
  if (url.indexOf(RouterClass.rootURL) === 0) {
    url = url.substr(RouterClass.rootURL.length);
  } else {
    throw new Error('URL not within root: ' + url);
  }

  // Wrap the callback, imposing a delay to force asynchronousness in
  // case the user calls it synchronously.
  var cb = once(delayed(function(err) {
    this._currentResponse = null;
    if (!err && !res.handled)
      err = new Unhandled(req);
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

  // Force async behavior so you have a chance to add listeners to the
  // request object.
  delayed(function() {
    invokeHandlers(RouterClass.middleware, req, res, cb);
  })();

  return res;
};

Router.use = function(middleware) {
  var RouterClass = this;
  RouterClass.middleware.push(middleware);
  return this;
};

Router.extend = function(opts) {
  var SuperClass = this;
  var NewRouter = function() {
    if (!(this instanceof NewRouter)) {
      return new NewRouter();
    }
    SuperClass.call(this);
  };
  inherits(NewRouter, SuperClass);

  // Add "static" props to the new router.
  for (var k in SuperClass) {
    if (SuperClass.hasOwnProperty(k)) {
      NewRouter[k] = SuperClass[k];
    }
  }

  NewRouter.rootURL = opts && opts.rootURL || '/';
  NewRouter.middleware = [];

  return NewRouter;
};

module.exports = Router;
