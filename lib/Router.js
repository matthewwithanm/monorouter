var extend = require('xtend');
var Route = require('./Route');
var Request = require('./Request');
var Response = require('./Response');
var Unhandled = require('./errors/Unhandled');
var delayed = require('./utils/delayed');
var getDefaultHistory = require('./history/getHistory');
var series = require('run-series');
var inherits = require('inherits');
var EventEmitter = require('wolfy87-eventemitter');
var attach = require('./attach');
var LinkHijacker = require('./LinkHijacker');
var withoutResults = require('./utils/withoutResults');
var thunkifyAll = require('./utils/thunkifyAll');


function Router(opts) {
  if (opts) {
    this.state = extend(opts.initialState);
    this.history = opts.history;
  }
  this.url = this.constructor.url.bind(this.constructor);
  // TODO: Should we add the properties from the class (i.e. rootUrl) to the instance?
}

inherits(Router, EventEmitter);


/**
 * Expose the `Unhandled` error so it can be used in handlers more easily.
 */
Router.Unhandled = Unhandled;

function throwNoEngine() {
  throw new Error('You are attempting to render but your router has no rendering engine.');
}

Router.engine = {
  renderInto: throwNoEngine,
  renderToString: throwNoEngine
};

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
  var name, path, handlers;

  if (typeof args[1] !== 'function') name = args.shift();
  path = args.shift();
  handlers = args;

  var route = new Route(path);

  if (name) {
    if (RouterClass.namedRoutes[name])
      throw new Error('Route with name "' + name + '" already exists.');
    RouterClass.namedRoutes[name] = route;
  }

  // Create and register a middleware to represent this route.
  RouterClass.use(function(req, next) {
    // If this route doesn't match, skip it.
    var match = route.match(req.path);
    if (!match) return next();

    req.params = match;

    series(thunkifyAll(handlers, this, [req]), withoutResults(next));
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

Router.prototype.render = function() {
  if (!this.view) {
    throw new Error('You must set a view before rendering');
  }
  return this.view(extend(this.state));
};

Router.finalMiddleware = [
  // If we've exhausted the middleware without handling the request, call the
  // `unhandled()` method. Going through `unhandled` instead of just creating an
  // error in the dispatch callback means we're always going through the same
  // process, getting the same events, etc.
  function(req, next) {
    if (!this.error && !this.ended) return this.unhandled();
    next();
  }
];

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

  // Wrap the callback, imposing a delay to force asynchronousness in
  // case the user calls it synchronously.
  var cb = function(err) {
    // Clean up listeners
    res.off('error', cb).off('end', cb);

    this._currentResponse = null;
    if (callback) callback(err, err ? null : res);
  }.bind(this);

  var first = (opts && opts.first) || !this._dispatchedFirstRequest;
  var req = new Request(url, extend(opts, {
    cause: opts && opts.cause,
    first: first,
    root: RouterClass.rootUrl
  }));
  this._dispatchedFirstRequest = true;

  var res = new Response(req, this)
    .on('error', cb)
    .on('end', cb);

  if (req.url == null) {
    delayed(function() {
      res.unhandled('URL not within router root: ' + url);
    })();
    return res;
  }

  if (this._currentResponse) {
    this._currentResponse.request.cancel();
  }
  this._currentResponse = res;

  // Force async behavior so you have a chance to add listeners to the
  // request object.
  var middleware = RouterClass.middleware.concat(RouterClass.finalMiddleware);
  delayed(function() {
    series(thunkifyAll(middleware, res, [req]), function(err) {
      if (err) {
        // Create a wrapper for each of the error middlewares that receives the
        // error from the previous one. This way, error middleware can pass a
        // different error than it received, and this new error can be handled
        // by subsequent error middleware. If an error middleware does not pass
        // an error or end the request, the request will be considered
        // unhandled.
        var previousError = err;
        var errorMiddleware = RouterClass.errorMiddleware.map(function(fn) {
          return function(done) {
            var newDone = function(err, result) {
              if (err) {
                previousError = err;
                done();
              } else {
                res.unhandled();
              }
            };
            try {
              fn.call(res, previousError, req, newDone);
            } catch (err) {
              newDone(err);
            }
          };
        });
        series(errorMiddleware, function() {
          if (previousError) res['throw'](previousError);
        });
      }
    });
  })();

  return res;
};

Router.prototype.captureClicks = function(el, opts) {
  return new LinkHijacker(this, el, opts);
};

Router.use = function(middleware) {
  var RouterClass = this,
      middlewares = middleware.length === 3 ? RouterClass.errorMiddleware : RouterClass.middleware;
  middlewares.push(middleware);
  return this;
};

Router.extend = function(opts) {
  var SuperClass = this;
  var NewRouter = function(opts) {
    if (!(this instanceof NewRouter)) {
      return new NewRouter(opts);
    }
    SuperClass.call(this, opts);
  };
  inherits(NewRouter, SuperClass);

  // Add "static" props to the new router.
  for (var k in SuperClass) {
    if (SuperClass.hasOwnProperty(k)) {
      NewRouter[k] = SuperClass[k];
    }
  }

  NewRouter.engine = opts && opts.engine;
  NewRouter.rootUrl = opts && opts.rootUrl || '';
  NewRouter.middleware = [];
  NewRouter.errorMiddleware = [];
  NewRouter.namedRoutes = {};

  return NewRouter;
};

Router.attach = function(element, opts) {
  return attach(this, element, opts);
};

/**
 * Extensions are just functions that mutate the router in any way they want
 * and return it. This function is just a prettier way to use them than calling
 * them directly.
 */
Router.setup = function(extension) {
  var router = extension(this);
  if (!router)
    throw new Error('Invalid extension: extension did not return router.');
  return router;
};

Router.url = function(name, params) {
  var route = this.namedRoutes[name];
  if (!route)
    throw new Error('There is no route named "' + name + '".');
  return route.url(params);
};

module.exports = Router;
