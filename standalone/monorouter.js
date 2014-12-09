!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.monorouter=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var urllite = _dereq_('urllite');
_dereq_('urllite/lib/extensions/toString');


/**
 * A utility for hijacking link clicks and forwarding them to the router.
 */
function LinkHijacker(router, el, opts) {
  this.router = router;
  this.element = el || window;
  this.blacklist = opts && opts.blacklist;
  this.handleClick = this.handleClick.bind(this);
  this.start();
}

LinkHijacker.prototype.start = function() {
  // This handler works by trying to route the URL and then, if it was
  // successful, updating the history. If the history object being used doesn't
  // support that, don't bother adding the event listener.
  if (!this.router.history.push) return;

  this.element.addEventListener('click', this.handleClick);
};

LinkHijacker.prototype.stop = function() {
  this.element.removeEventListener('click', this.handleClick);
};

LinkHijacker.prototype.handleClick = function(event) {
  // Ignore canceled events, modified clicks, and right clicks.
  if (event.defaultPrevented) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey) return;
  if (event.button !== 0) return;

  // Get the <a> element.
  var el = event.target;
  while (el && el.nodeName !== 'A') {
    el = el.parentNode;
  }

  // Ignore clicks from non-a elements.
  if (!el) return;

  // Ignore the click if the element has a target.
  if (el.target && el.target !== '_self') return;

  // Ignore the click if it's a download link. (We use this method of
  // detecting the presence of the attribute for old IE versions.)
  if (!!el.attributes.download) return;

  // Use a regular expression to parse URLs instead of relying on the browser
  // to do it for us (because IE).
  var url = urllite(el.href);
  var windowURL = urllite(window.location.href);

  // Ignore links that don't share a protocol and host with ours.
  if (url.protocol !== windowURL.protocol || url.host !== windowURL.host)
    return;

  var fullPath = url.pathname + url.search + url.hash;

  // Ignore URLs that don't share the router's rootUrl
  if (fullPath.indexOf(this.router.constructor.rootUrl) !== 0) return;

  // Ignore 'rel="external"' links.
  if (el.rel && /(?:^|\s+)external(?:\s+|$)/.test(el.rel)) return;

  // Ignore any blacklisted links.
  if (this.blacklist) {
    for (var i = 0, len = this.blacklist.length; i < len; i++) {
      var blacklisted = this.blacklist[i];

      // The blacklist can contain strings or regexps (or anything else with a
      // "test" function).
      if (blacklisted === fullPath) return;
      if (blacklisted.test && blacklisted.test(fullPath)) return;
    }
  }

  event.preventDefault();

  // Dispatch the URL.
  this.router.history.navigate(fullPath, {cause: 'link'});
};

module.exports = LinkHijacker;

},{"urllite":25,"urllite/lib/extensions/toString":30}],2:[function(_dereq_,module,exports){
var queryString = _dereq_('query-string');
var urllite = _dereq_('urllite');
var Cancel = _dereq_('./errors/Cancel');
var EventEmitter = _dereq_('wolfy87-eventemitter');
var inherits = _dereq_('inherits');
_dereq_('urllite/lib/extensions/resolve');


function getUrl(url, root) {
  if (root && root !== '/') {
    var parsedRoot = urllite(root);
    var hostsMatch = !url.host || !parsedRoot.host ||
                     (url.host === parsedRoot.host);
    var inRoot = hostsMatch && url.pathname.indexOf(parsedRoot.pathname) === 0;
    if (inRoot) {
      var resolvedPath = url.pathname.slice(parsedRoot.pathname.length);
      resolvedPath = resolvedPath.charAt(0) === '/' ? resolvedPath : '/' + resolvedPath;
      return resolvedPath + url.search;
    }
    return null;
  }
  return url.pathname + url.search;
}

/**
 * An object representing the request to be routed. This object is meant to be
 * familiar to users of server libraries like Express and koa.
 */
function Request(url, opts) {
  var parsed = urllite(url);

  // Make sure we have the host information.
  if (!parsed.host) {
    if ((typeof document !== 'undefined') && document.location) {
      parsed = parsed.resolve(document.location.href);
    } else {
      throw new Error("You need to dispatch absolute URLs on the server.");
    }
  }

  importOwnProps(this, opts);
  this.location = parsed;
  this.url = getUrl(parsed, opts && opts.root);
  this.originalUrl = parsed.pathname + parsed.search;
  this.path = parsed.pathname;
  this.protocol = parsed.protocol.replace(/:$/, '');
  this.hostname = parsed.hostname;
  this.host = parsed.host;
  this.search = parsed.search;
  this.querystring = parsed.search.replace(/^\?/, '');
  this.query = queryString.parse(parsed.search);
  this.hash = parsed.hash;
  this.fragment = parsed.hash.replace(/^#/, '');
}

// Make requests event emitters.
inherits(Request, EventEmitter);

/**
 * Get a specific param by name or index.
 *
 * @param {number|string} The index or name of the param.
 * @return {object} The matched variables
 */
Request.prototype.param = function(indexOrName) {
  return this.params[indexOrName];
};

/**
 * Check whether the request triggered by one of the the specified causes.
 */
Request.prototype.from = function() {
  var causes;
  if (typeof arguments[0] === 'string') causes = arguments;
  else causes = arguments[0];

  if (causes && causes.length) {
    for (var i = 0, len = causes.length; i < len; i++) {
      if (causes[i] === this.cause) return true;
    }
  }
  return false;
};

Request.prototype.cancel = function() {
  if (!this.canceled) {
    this.canceled = true;
    this.emit('cancel', new Cancel(this));
  }
};

Request.prototype.canceled = false;

module.exports = Request;

function importOwnProps(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) {
    if (own.call(src, key)) {
      obj[key] = src[key];
    }
  }
  return obj;
}

},{"./errors/Cancel":7,"inherits":21,"query-string":22,"urllite":25,"urllite/lib/extensions/resolve":29,"wolfy87-eventemitter":31}],3:[function(_dereq_,module,exports){
var inherits = _dereq_('inherits');
var Unhandled = _dereq_('./errors/Unhandled');
var EventEmitter = _dereq_('wolfy87-eventemitter');
var extend = _dereq_('xtend');
var delayed = _dereq_('./utils/delayed');
var parallel = _dereq_('run-parallel');
var withoutResults = _dereq_('./utils/withoutResults');
var thunkifyAll = _dereq_('./utils/thunkifyAll');
var noop = _dereq_('./utils/noop');


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
  return this;
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

},{"./errors/Unhandled":8,"./utils/delayed":16,"./utils/noop":17,"./utils/thunkifyAll":19,"./utils/withoutResults":20,"inherits":21,"run-parallel":23,"wolfy87-eventemitter":31,"xtend":32}],4:[function(_dereq_,module,exports){
var pathToRegexp = _dereq_('./utils/pathToRegexp');


function Route(path) {
  this.path = path;
  this.keys = [];
  this.tokens = [];
  this.regexp = pathToRegexp(path, this.keys, this.tokens, {strict: true});
}

Route.prototype.match = function(url) {
  var match = url.match(this.regexp);
  if (!match) return;
  var matchObj = {};
  for (var i = 1, len = match.length; i < len; i++) {
    matchObj[i] = matchObj[this.keys[i - 1].name] = match[i];
  }
  return matchObj;
};

Route.prototype.url = function(params) {
  return this.tokens.map(function(token) {
    if (token.literal != null) return token.literal;
    if (token.name) {
      if (params && params[token.name] != null)
        return token.delimiter + params[token.name];
      else if (token.optional)
        return '';
      throw new Error('Missing required param "' + token.name + '"');
    }
  }).join('');
};

module.exports = Route;

},{"./utils/pathToRegexp":18}],5:[function(_dereq_,module,exports){
var extend = _dereq_('xtend');
var Route = _dereq_('./Route');
var Request = _dereq_('./Request');
var Response = _dereq_('./Response');
var Unhandled = _dereq_('./errors/Unhandled');
var delayed = _dereq_('./utils/delayed');
var getDefaultHistory = _dereq_('./history/getHistory');
var series = _dereq_('run-series');
var inherits = _dereq_('inherits');
var EventEmitter = _dereq_('wolfy87-eventemitter');
var attach = _dereq_('./attach');
var LinkHijacker = _dereq_('./LinkHijacker');
var withoutResults = _dereq_('./utils/withoutResults');
var thunkifyAll = _dereq_('./utils/thunkifyAll');


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
    res.removeAllListeners();
    req.removeAllListeners();

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
      if (k === 'super_' || k === 'prototype') continue;
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

},{"./LinkHijacker":1,"./Request":2,"./Response":3,"./Route":4,"./attach":6,"./errors/Unhandled":8,"./history/getHistory":15,"./utils/delayed":16,"./utils/thunkifyAll":19,"./utils/withoutResults":20,"inherits":21,"run-series":24,"wolfy87-eventemitter":31,"xtend":32}],6:[function(_dereq_,module,exports){
var getDefaultHistory = _dereq_('./history/getHistory');


/**
 * Bootstraps the app by getting the initial state.
 */
function attach(Router, element, opts) {
  if (!opts) opts = {};
  var history = opts.history || getDefaultHistory();
  var router = new Router({history: history});

  var render = function() {
    Router.engine.renderInto(router, element);
  };

  var onInitialReady = function() {
    render();
    router
      .on('viewChange', render)
      .on('stateChange', render);

    // Now that the view has been bootstrapped (i.e. is in its inital state), it
    // can be updated.
    update();
    history.on('update', function(meta) {
      update(meta);
    });
  };

  var previousURL;
  var update = function(meta) {
    var url = history.currentURL();
    if (url === previousURL) return;
    previousURL = url;

    var res = router.dispatch(url, meta, function(err) {
      if (err && (err.name !== 'Unhandled') && (err.name !== 'Cancel')) {
        throw err;
      }
    });

    if (meta && meta.cause === 'startup') {
      res.once('initialReady', onInitialReady);
    }
  };

  // Start the process.
  update({cause: 'startup'});

  return router;
}

module.exports = attach;

},{"./history/getHistory":15}],7:[function(_dereq_,module,exports){
var initError = _dereq_('./initError');

function Cancel(request) {
  initError(this, 'Cancel', 'Request was canceled: ' + request.path);
  this.request = request;
}

Cancel.prototype = Error.prototype;

module.exports = Cancel;

},{"./initError":9}],8:[function(_dereq_,module,exports){
var initError = _dereq_('./initError');

function Unhandled(request, msg) {
  if (!msg) msg = 'Path not found: ' + request.path;
  initError(this, 'Unhandled', msg);
  this.request = request;
}

Unhandled.prototype = Error.prototype;

module.exports = Unhandled;

},{"./initError":9}],9:[function(_dereq_,module,exports){
function initError(error, name, msg) {
  var source = new Error(msg);
  error.name = source.name = name;
  error.message = source.message;

  if (source.stack) {
    error.stack = source.stack;
  }

  error.toString = function() {
    return this.name + ': ' + this.message;
  }
};

module.exports = initError;

},{}],10:[function(_dereq_,module,exports){
var Router = _dereq_('./Router');

function monorouter(opts) {
  return Router.extend(opts);
}

module.exports = monorouter;

},{"./Router":5}],11:[function(_dereq_,module,exports){
var inherits = _dereq_('inherits');
var EventEmitter = _dereq_('wolfy87-eventemitter');


function BaseHistory() {}

// Make BaseHistory an event emitter.
inherits(BaseHistory, EventEmitter);

/**
 * Navigate to the provided URL without creating a duplicate history entry if
 * you're already there.
 */
BaseHistory.prototype.navigate = function(url, meta) {
    if (url !== this.currentURL()) {
        this.push(url, meta);
    } else {
        this.replace(url, meta);
    }
};

module.exports = BaseHistory;

},{"inherits":21,"wolfy87-eventemitter":31}],12:[function(_dereq_,module,exports){
var inherits = _dereq_('inherits');
var BaseHistory = _dereq_('./BaseHistory');
var urllite = _dereq_ ('urllite');


/**
 * A history interface for browsers that don't support pushState.
 */
function FallbackHistory() {}

inherits(FallbackHistory, BaseHistory);

FallbackHistory.prototype.currentURL = function() {
  // If we have our own idea of the URL, use that.
  if (this._url) return this._url;

  // Use urllite to pave over IE issues with pathname.
  var parsed = urllite(document.location.href);
  return parsed.pathname + parsed.search + parsed.hash;
};

FallbackHistory.prototype.push = function(path) {
  // No need to update `this._url`—this code is all going to be reloaded.
  window.location = path;
};

FallbackHistory.prototype.replace = function(path, meta) {
  // For the fallback history, `replace` won't actually change the browser
  // address, but will update its own URL. This is because `replace` usually
  // corresponds to "lesser" state changes: having a stale browser URL is
  // considered more acceptable than refreshing the entire page.
  this._url = path;
  this.emit('update', meta);
};

module.exports = FallbackHistory;

},{"./BaseHistory":11,"inherits":21,"urllite":25}],13:[function(_dereq_,module,exports){
var PushStateHistory = _dereq_('./PushStateHistory');
var FallbackHistory = _dereq_('./FallbackHistory');


var win = typeof window !== 'undefined' ? window : null;
var history = win && win.history;

module.exports = history && history.pushState ? PushStateHistory : FallbackHistory;

},{"./FallbackHistory":12,"./PushStateHistory":14}],14:[function(_dereq_,module,exports){
var inherits = _dereq_('inherits');
var BaseHistory = _dereq_('./BaseHistory');
var urllite = _dereq_ ('urllite');


/**
 * A history implementation that uses `pushState`.
 */
function PushStateHistory() {
  window.addEventListener('popstate', function(event) {
    this.emit('update', {cause: 'popstate'});
  }.bind(this));
}

inherits(PushStateHistory, BaseHistory);

PushStateHistory.prototype.currentURL = function() {
  // Use urllite to pave over IE issues with pathname.
  var parsed = urllite(document.location.href);
  return parsed.pathname + parsed.search + parsed.hash;
};

PushStateHistory.prototype.push = function(path, meta) {
  window.history.pushState({}, '', path);
  this.emit('update', meta);
};

PushStateHistory.prototype.replace = function(path, meta) {
  window.history.replaceState({}, '', path);
  this.emit('update', meta);
};

module.exports = PushStateHistory;

},{"./BaseHistory":11,"inherits":21,"urllite":25}],15:[function(_dereq_,module,exports){
var History = _dereq_('./History');

var singleton;

function getHistory() {
  if (!singleton)
    singleton = new History();
  return singleton;
}

module.exports = getHistory;

},{"./History":13}],16:[function(_dereq_,module,exports){
var delay = typeof setImmediate === 'function' ? setImmediate : function(fn) {
  setTimeout(fn, 0);
};

/**
 * Creates a delayed version of the provided function. This is used to guarantee
 * ansynchronous behavior for potentially synchronous operations.
 */
function delayed(fn) {
  return function() {
    var args = arguments;
    var self = this;
    var fnWithArgs = function() {
      fn.apply(self, args);
    };
    delay(fnWithArgs);
  };
}

module.exports = delayed;

},{}],17:[function(_dereq_,module,exports){
module.exports = function() {};

},{}],18:[function(_dereq_,module,exports){
// A custom version of Blake Embrey's path-to-regexp—modified in order to
// support URL reversal.

/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Blake Embrey (hello@blakeembrey.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Expose `pathtoRegexp`.
 */
module.exports = pathtoRegexp;

var PATH_REGEXP = new RegExp([
  // Match already escaped characters that would otherwise incorrectly appear
  // in future matches. This allows the user to escape special characters that
  // shouldn't be transformed.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
  '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',
  // Match regexp special characters that should always be escaped.
  '([.+*?=^!:${}()[\\]|\\/])'
].join('|'), 'g');

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1');
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array should be passed in, which will contain the placeholder key
 * names. For example `/user/:id` will then contain `["id"]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 keys
 * @param  {Array}                 tokens
 * @param  {Object}                options
 * @return {RegExp}
 */
function pathtoRegexp (path, keys, tokens, options) {
  keys = keys || [];
  tokens = tokens || [];
  options = options || {};

  var strict = options.strict;
  var end = options.end !== false;
  var flags = options.sensitive ? '' : 'i';
  var index = 0;

  var charIndex = 0;
  var originalPath = path;

  // Alter the path string into a usable regexp.
  path = path.replace(PATH_REGEXP, function (match, escaped, prefix, key, capture, group, suffix, escape, offset) {

    if (offset !== charIndex) {
      tokens.push({literal: path.slice(charIndex, offset)});
    }
    charIndex = offset + match.length;

    // Avoiding re-escaping escaped characters.
    if (escaped) {
      return escaped;
    }

    // Escape regexp special characters.
    if (escape) {
      tokens.push({literal: escape});
      return '\\' + escape;
    }

    var repeat   = suffix === '+' || suffix === '*';
    var optional = suffix === '?' || suffix === '*';

    keys.push({
      name:      key || index++,
      delimiter: prefix || '/',
      optional:  optional,
      repeat:    repeat
    });
    tokens.push(keys[keys.length - 1]);

    // Escape the prefix character.
    prefix = prefix ? '\\' + prefix : '';

    // Match using the custom capturing group, or fallback to capturing
    // everything up to the next slash (or next period if the param was
    // prefixed with a period).
    capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');

    // Allow parameters to be repeated more than once.
    if (repeat) {
      capture = capture + '(?:' + prefix + capture + ')*';
    }

    // Allow a parameter to be optional.
    if (optional) {
      return '(?:' + prefix + '(' + capture + '))?';
    }

    // Basic parameter support.
    return prefix + '(' + capture + ')';
  });

  // Add any unconsumed part of the string to our token list.
  if (charIndex !== originalPath.length) {
    tokens.push({literal: originalPath.slice(charIndex, originalPath.length)});
  }

  // Check whether the path ends in a slash as it alters some match behaviour.
  var endsWithSlash = path[path.length - 1] === '/';

  // In non-strict mode we allow an optional trailing slash in the match. If
  // the path to match already ended with a slash, we need to remove it for
  // consistency. The slash is only valid at the very end of a path match, not
  // anywhere in the middle. This is important for non-ending mode, otherwise
  // "/test/" will match "/test//route".
  if (!strict) {
    path = (endsWithSlash ? path.slice(0, -2) : path) + '(?:\\/(?=$))?';
  }

  // In non-ending mode, we need prompt the capturing groups to match as much
  // as possible by using a positive lookahead for the end or next path segment.
  if (!end) {
    path += strict && endsWithSlash ? '' : '(?=\\/|$)';
  }

  return new RegExp('^' + path + (end ? '$' : ''), flags);
}

},{}],19:[function(_dereq_,module,exports){
/**
 * Return thunkified versions of the provided functions bound to the specified
 * context and with the provided initial args.
 */
function thunkifyAll(fns, thisArg, args) {
  fns = fns || [];
  return fns.map(function(fn) {
    return function(done) {
      var newArgs = args ? Array.prototype.slice.call(args, 0) : [];
      newArgs.push(done);
      try {
        fn.apply(thisArg, newArgs);
      } catch (err) {
        done(err);
      }
    };
  });
}

module.exports = thunkifyAll;

},{}],20:[function(_dereq_,module,exports){
/**
 * Creates a new version of a callback that doesn't get the results. This is
 * used so that we don't forward collected results from run-series.
 */
function withoutResults(callback, thisArg) {
  if (callback) {
    return function(err, results) {
      return callback.call(thisArg, err);
    };
  }
}

module.exports = withoutResults;

},{}],21:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],22:[function(_dereq_,module,exports){
/*!
	query-string
	Parse and stringify URL query strings
	https://github.com/sindresorhus/query-string
	by Sindre Sorhus
	MIT License
*/
(function () {
	'use strict';
	var queryString = {};

	queryString.parse = function (str) {
		if (typeof str !== 'string') {
			return {};
		}

		str = str.trim().replace(/^(\?|#)/, '');

		if (!str) {
			return {};
		}

		return str.trim().split('&').reduce(function (ret, param) {
			var parts = param.replace(/\+/g, ' ').split('=');
			var key = parts[0];
			var val = parts[1];

			key = decodeURIComponent(key);
			// missing `=` should be `null`:
			// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
			val = val === undefined ? null : decodeURIComponent(val);

			if (!ret.hasOwnProperty(key)) {
				ret[key] = val;
			} else if (Array.isArray(ret[key])) {
				ret[key].push(val);
			} else {
				ret[key] = [ret[key], val];
			}

			return ret;
		}, {});
	};

	queryString.stringify = function (obj) {
		return obj ? Object.keys(obj).map(function (key) {
			var val = obj[key];

			if (Array.isArray(val)) {
				return val.map(function (val2) {
					return encodeURIComponent(key) + '=' + encodeURIComponent(val2);
				}).join('&');
			}

			return encodeURIComponent(key) + '=' + encodeURIComponent(val);
		}).join('&') : '';
	};

	if (typeof define === 'function' && define.amd) {
		define(function() { return queryString; });
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = queryString;
	} else {
		window.queryString = queryString;
	}
})();

},{}],23:[function(_dereq_,module,exports){
module.exports = function (tasks, cb) {
  var results, pending, keys
  if (Array.isArray(tasks)) {
    results = []
    pending = tasks.length
  } else {
    keys = Object.keys(tasks)
    results = {}
    pending = keys.length
  }

  function done (i, err, result) {
    results[i] = result
    if (--pending === 0 || err) {
      cb && cb(err, results)
      cb = null
    }
  }

  if (!pending) {
    // empty
    cb && cb(null, results)
    cb = null
  } else if (keys) {
    // object
    keys.forEach(function (key) {
      tasks[key](done.bind(undefined, key))
    })
  } else {
    // array
    tasks.forEach(function (task, i) {
      task(done.bind(undefined, i))
    })
  }
}

},{}],24:[function(_dereq_,module,exports){
module.exports = function (tasks, cb) {
  var current = 0
  var results = []
  cb = cb || function () {}

  function done (err, result) {
    if (err) return cb(err, results)
    results.push(result)

    if (++current >= tasks.length) {
      cb(null, results)
    } else {
      tasks[current](done)
    }
  }

  if (tasks.length) {
    tasks[0](done)
  } else {
    cb(null, [])
  }
}

},{}],25:[function(_dereq_,module,exports){
(function() {
  var urllite;

  urllite = _dereq_('./core');

  _dereq_('./extensions/resolve');

  _dereq_('./extensions/relativize');

  _dereq_('./extensions/normalize');

  _dereq_('./extensions/toString');

  module.exports = urllite;

}).call(this);

},{"./core":26,"./extensions/normalize":27,"./extensions/relativize":28,"./extensions/resolve":29,"./extensions/toString":30}],26:[function(_dereq_,module,exports){
(function() {
  var URL, URL_PATTERN, defaults, urllite,
    __hasProp = {}.hasOwnProperty,
    __slice = [].slice;

  URL_PATTERN = /^(?:(?:([^:\/?\#]+:)\/+|(\/\/))(?:([a-z0-9-\._~%]+)(?::([a-z0-9-\._~%]+))?@)?(([a-z0-9-\._~%!$&'()*+,;=]+)(?::([0-9]+))?)?)?([^?\#]*?)(\?[^\#]*)?(\#.*)?$/;

  urllite = function(raw, opts) {
    return urllite.URL.parse(raw, opts);
  };

  urllite.URL = URL = (function() {
    function URL(props) {
      var k, v;
      for (k in props) {
        if (!__hasProp.call(props, k)) continue;
        v = props[k];
        this[k] = v;
      }
    }

    URL.parse = function(raw) {
      var m, pathname, protocol;
      m = raw.toString().match(URL_PATTERN);
      pathname = m[8] || '';
      protocol = m[1];
      return urllite._createURL({
        protocol: protocol,
        username: m[3],
        password: m[4],
        hostname: m[6],
        port: m[7],
        pathname: protocol && pathname.charAt(0) !== '/' ? "/" + pathname : pathname,
        search: m[9],
        hash: m[10],
        isSchemeRelative: m[2] != null
      });
    };

    return URL;

  })();

  defaults = {
    protocol: '',
    username: '',
    password: '',
    host: '',
    hostname: '',
    port: '',
    pathname: '',
    search: '',
    hash: '',
    origin: '',
    isSchemeRelative: false
  };

  urllite._createURL = function() {
    var base, bases, k, props, v, _i, _len, _ref, _ref1;
    bases = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    props = {};
    for (_i = 0, _len = bases.length; _i < _len; _i++) {
      base = bases[_i];
      for (k in defaults) {
        if (!__hasProp.call(defaults, k)) continue;
        v = defaults[k];
        props[k] = (_ref = (_ref1 = base[k]) != null ? _ref1 : props[k]) != null ? _ref : v;
      }
    }
    props.host = props.hostname && props.port ? "" + props.hostname + ":" + props.port : props.hostname ? props.hostname : '';
    props.origin = props.protocol ? "" + props.protocol + "//" + props.host : '';
    props.isAbsolutePathRelative = !props.host && props.pathname.charAt(0) === '/';
    props.isPathRelative = !props.host && props.pathname.charAt(0) !== '/';
    props.isRelative = props.isSchemeRelative || props.isAbsolutePathRelative || props.isPathRelative;
    props.isAbsolute = !props.isRelative;
    return new urllite.URL(props);
  };

  module.exports = urllite;

}).call(this);

},{}],27:[function(_dereq_,module,exports){
(function() {
  var URL, urllite;

  urllite = _dereq_('../core');

  URL = urllite.URL;

  URL.prototype.normalize = function() {
    var m, pathname;
    pathname = this.pathname;
    while (m = /^(.*?)[^\/]+\/\.\.\/*(.*)$/.exec(pathname)) {
      pathname = "" + m[1] + m[2];
    }
    if (this.host && pathname.indexOf('..') !== -1) {
      throw new Error('Path is behind root.');
    }
    return urllite._createURL(this, {
      pathname: pathname
    });
  };

}).call(this);

},{"../core":26}],28:[function(_dereq_,module,exports){
(function() {
  var URL, urllite;

  urllite = _dereq_('../core');

  _dereq_('./resolve');

  URL = urllite.URL;

  URL.prototype.relativize = function(other) {
    var c, i, newSegments, otherSegments, url, urlSegments, _i, _len, _ref;
    if (this.isPathRelative) {
      return new urllite.URL(this);
    }
    if (typeof other === 'string') {
      other = urllite(other);
    }
    url = this.resolve(other);
    if (url.origin && url.origin !== other.origin) {
      throw new Error("Origins don't match (" + url.origin + " and " + other.origin + ")");
    } else if (!other.isAbsolute && !other.isAbsolutePathRelative) {
      throw new Error("Other URL (<" + other + ">) is neither absolute nor absolute path relative.");
    }
    otherSegments = other.pathname.split('/').slice(1);
    urlSegments = url.pathname.split('/').slice(1);
    for (i = _i = 0, _len = urlSegments.length; _i < _len; i = ++_i) {
      c = urlSegments[i];
      if (!(c === otherSegments[i] && (urlSegments.length > (_ref = i + 1) && _ref < otherSegments.length))) {
        break;
      }
    }
    newSegments = urlSegments.slice(i);
    while (i < otherSegments.length - 1) {
      if (otherSegments[i]) {
        newSegments.unshift('..');
      }
      i++;
    }
    if (newSegments.length === 1) {
      newSegments = newSegments[0] === otherSegments[i] ? [''] : newSegments[0] === '' ? ['.'] : newSegments;
    }
    return urllite._createURL({
      pathname: newSegments.join('/'),
      search: url.search,
      hash: url.hash
    });
  };

}).call(this);

},{"../core":26,"./resolve":29}],29:[function(_dereq_,module,exports){
(function() {
  var URL, copyProps, oldParse, urllite,
    __slice = [].slice;

  urllite = _dereq_('../core');

  _dereq_('./normalize');

  URL = urllite.URL;

  oldParse = URL.parse;

  copyProps = function() {
    var prop, props, source, target, _i, _len;
    target = arguments[0], source = arguments[1], props = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    for (_i = 0, _len = props.length; _i < _len; _i++) {
      prop = props[_i];
      target[prop] = source[prop];
    }
    return target;
  };

  URL.parse = function(raw, opts) {
    var base, url;
    if (base = opts != null ? opts.base : void 0) {
      delete opts.base;
    }
    url = oldParse(raw, opts);
    if (base) {
      return url.resolve(base);
    } else {
      return url;
    }
  };

  URL.prototype.resolve = function(base) {
    var p, prefix;
    if (this.isAbsolute) {
      return new urllite.URL(this);
    }
    if (typeof base === 'string') {
      base = urllite(base);
    }
    p = {};
    if (this.isSchemeRelative) {
      copyProps(p, this, 'username', 'password', 'host', 'hostname', 'port', 'pathname', 'search', 'hash');
      p.isSchemeRelative = !(p.protocol = base.protocol);
    } else if (this.isAbsolutePathRelative || this.isPathRelative) {
      copyProps(p, this, 'search', 'hash');
      copyProps(p, base, 'protocol', 'username', 'password', 'host', 'hostname', 'port');
      p.pathname = this.isPathRelative ? base.pathname.slice(0, -1) === '/' ? "" + base.pathname + "/" + this.pathname : (prefix = base.pathname.split('/').slice(0, -1).join('/'), prefix ? "" + prefix + "/" + this.pathname : this.pathname) : this.pathname;
    }
    return urllite._createURL(p).normalize();
  };

}).call(this);

},{"../core":26,"./normalize":27}],30:[function(_dereq_,module,exports){
(function() {
  var URL, urllite;

  urllite = _dereq_('../core');

  URL = urllite.URL;

  URL.prototype.toString = function() {
    var authority, prefix, userinfo;
    prefix = this.isSchemeRelative ? '//' : this.protocol === 'file:' ? "" + this.protocol + "///" : this.protocol ? "" + this.protocol + "//" : '';
    userinfo = this.password ? "" + this.username + ":" + this.password : this.username ? "" + this.username : '';
    authority = userinfo ? "" + userinfo + "@" + this.host : this.host ? "" + this.host : '';
    return "" + prefix + authority + this.pathname + this.search + this.hash;
  };

}).call(this);

},{"../core":26}],31:[function(_dereq_,module,exports){
/*!
 * EventEmitter v4.2.6 - git.io/ee
 * Oliver Caldwell
 * MIT license
 * @preserve
 */

(function () {
	'use strict';

	/**
	 * Class for managing events.
	 * Can be extended to provide event functionality in other classes.
	 *
	 * @class EventEmitter Manages event registering and emitting.
	 */
	function EventEmitter() {}

	// Shortcuts to improve speed and size
	var proto = EventEmitter.prototype;
	var exports = this;
	var originalGlobalValue = exports.EventEmitter;

	/**
	 * Finds the index of the listener for the event in it's storage array.
	 *
	 * @param {Function[]} listeners Array of listeners to search through.
	 * @param {Function} listener Method to look for.
	 * @return {Number} Index of the specified listener, -1 if not found
	 * @api private
	 */
	function indexOfListener(listeners, listener) {
		var i = listeners.length;
		while (i--) {
			if (listeners[i].listener === listener) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Alias a method while keeping the context correct, to allow for overwriting of target method.
	 *
	 * @param {String} name The name of the target method.
	 * @return {Function} The aliased method
	 * @api private
	 */
	function alias(name) {
		return function aliasClosure() {
			return this[name].apply(this, arguments);
		};
	}

	/**
	 * Returns the listener array for the specified event.
	 * Will initialise the event object and listener arrays if required.
	 * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
	 * Each property in the object response is an array of listener functions.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Function[]|Object} All listener functions for the event.
	 */
	proto.getListeners = function getListeners(evt) {
		var events = this._getEvents();
		var response;
		var key;

		// Return a concatenated array of all matching events if
		// the selector is a regular expression.
		if (typeof evt === 'object') {
			response = {};
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					response[key] = events[key];
				}
			}
		}
		else {
			response = events[evt] || (events[evt] = []);
		}

		return response;
	};

	/**
	 * Takes a list of listener objects and flattens it into a list of listener functions.
	 *
	 * @param {Object[]} listeners Raw listener objects.
	 * @return {Function[]} Just the listener functions.
	 */
	proto.flattenListeners = function flattenListeners(listeners) {
		var flatListeners = [];
		var i;

		for (i = 0; i < listeners.length; i += 1) {
			flatListeners.push(listeners[i].listener);
		}

		return flatListeners;
	};

	/**
	 * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Object} All listener functions for an event in an object.
	 */
	proto.getListenersAsObject = function getListenersAsObject(evt) {
		var listeners = this.getListeners(evt);
		var response;

		if (listeners instanceof Array) {
			response = {};
			response[evt] = listeners;
		}

		return response || listeners;
	};

	/**
	 * Adds a listener function to the specified event.
	 * The listener will not be added if it is a duplicate.
	 * If the listener returns true then it will be removed after it is called.
	 * If you pass a regular expression as the event name then the listener will be added to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListener = function addListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var listenerIsWrapped = typeof listener === 'object';
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
				listeners[key].push(listenerIsWrapped ? listener : {
					listener: listener,
					once: false
				});
			}
		}

		return this;
	};

	/**
	 * Alias of addListener
	 */
	proto.on = alias('addListener');

	/**
	 * Semi-alias of addListener. It will add a listener that will be
	 * automatically removed after it's first execution.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addOnceListener = function addOnceListener(evt, listener) {
		return this.addListener(evt, {
			listener: listener,
			once: true
		});
	};

	/**
	 * Alias of addOnceListener.
	 */
	proto.once = alias('addOnceListener');

	/**
	 * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
	 * You need to tell it what event names should be matched by a regex.
	 *
	 * @param {String} evt Name of the event to create.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvent = function defineEvent(evt) {
		this.getListeners(evt);
		return this;
	};

	/**
	 * Uses defineEvent to define multiple events.
	 *
	 * @param {String[]} evts An array of event names to define.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvents = function defineEvents(evts) {
		for (var i = 0; i < evts.length; i += 1) {
			this.defineEvent(evts[i]);
		}
		return this;
	};

	/**
	 * Removes a listener function from the specified event.
	 * When passed a regular expression as the event name, it will remove the listener from all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to remove the listener from.
	 * @param {Function} listener Method to remove from the event.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListener = function removeListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var index;
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				index = indexOfListener(listeners[key], listener);

				if (index !== -1) {
					listeners[key].splice(index, 1);
				}
			}
		}

		return this;
	};

	/**
	 * Alias of removeListener
	 */
	proto.off = alias('removeListener');

	/**
	 * Adds listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
	 * You can also pass it a regular expression to add the array of listeners to all events that match it.
	 * Yeah, this function does quite a bit. That's probably a bad thing.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListeners = function addListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(false, evt, listeners);
	};

	/**
	 * Removes listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be removed.
	 * You can also pass it a regular expression to remove the listeners from all events that match it.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListeners = function removeListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(true, evt, listeners);
	};

	/**
	 * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
	 * The first argument will determine if the listeners are removed (true) or added (false).
	 * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be added/removed.
	 * You can also pass it a regular expression to manipulate the listeners of all events that match it.
	 *
	 * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
		var i;
		var value;
		var single = remove ? this.removeListener : this.addListener;
		var multiple = remove ? this.removeListeners : this.addListeners;

		// If evt is an object then pass each of it's properties to this method
		if (typeof evt === 'object' && !(evt instanceof RegExp)) {
			for (i in evt) {
				if (evt.hasOwnProperty(i) && (value = evt[i])) {
					// Pass the single listener straight through to the singular method
					if (typeof value === 'function') {
						single.call(this, i, value);
					}
					else {
						// Otherwise pass back to the multiple function
						multiple.call(this, i, value);
					}
				}
			}
		}
		else {
			// So evt must be a string
			// And listeners must be an array of listeners
			// Loop over it and pass each one to the multiple method
			i = listeners.length;
			while (i--) {
				single.call(this, evt, listeners[i]);
			}
		}

		return this;
	};

	/**
	 * Removes all listeners from a specified event.
	 * If you do not specify an event then all listeners will be removed.
	 * That means every event will be emptied.
	 * You can also pass a regex to remove all events that match it.
	 *
	 * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeEvent = function removeEvent(evt) {
		var type = typeof evt;
		var events = this._getEvents();
		var key;

		// Remove different things depending on the state of evt
		if (type === 'string') {
			// Remove all listeners for the specified event
			delete events[evt];
		}
		else if (type === 'object') {
			// Remove all events matching the regex.
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					delete events[key];
				}
			}
		}
		else {
			// Remove all listeners in all events
			delete this._events;
		}

		return this;
	};

	/**
	 * Alias of removeEvent.
	 *
	 * Added to mirror the node API.
	 */
	proto.removeAllListeners = alias('removeEvent');

	/**
	 * Emits an event of your choice.
	 * When emitted, every listener attached to that event will be executed.
	 * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
	 * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
	 * So they will not arrive within the array on the other side, they will be separate.
	 * You can also pass a regular expression to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {Array} [args] Optional array of arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emitEvent = function emitEvent(evt, args) {
		var listeners = this.getListenersAsObject(evt);
		var listener;
		var i;
		var key;
		var response;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				i = listeners[key].length;

				while (i--) {
					// If the listener returns true then it shall be removed from the event
					// The function is executed either with a basic call or an apply if there is an args array
					listener = listeners[key][i];

					if (listener.once === true) {
						this.removeListener(evt, listener.listener);
					}

					response = listener.listener.apply(this, args || []);

					if (response === this._getOnceReturnValue()) {
						this.removeListener(evt, listener.listener);
					}
				}
			}
		}

		return this;
	};

	/**
	 * Alias of emitEvent
	 */
	proto.trigger = alias('emitEvent');

	/**
	 * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
	 * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {...*} Optional additional arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emit = function emit(evt) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.emitEvent(evt, args);
	};

	/**
	 * Sets the current value to check against when executing listeners. If a
	 * listeners return value matches the one set here then it will be removed
	 * after execution. This value defaults to true.
	 *
	 * @param {*} value The new value to check for when executing listeners.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.setOnceReturnValue = function setOnceReturnValue(value) {
		this._onceReturnValue = value;
		return this;
	};

	/**
	 * Fetches the current value to check against when executing listeners. If
	 * the listeners return value matches this one then it should be removed
	 * automatically. It will return true by default.
	 *
	 * @return {*|Boolean} The current value to check for or the default, true.
	 * @api private
	 */
	proto._getOnceReturnValue = function _getOnceReturnValue() {
		if (this.hasOwnProperty('_onceReturnValue')) {
			return this._onceReturnValue;
		}
		else {
			return true;
		}
	};

	/**
	 * Fetches the events object and creates one if required.
	 *
	 * @return {Object} The events storage object.
	 * @api private
	 */
	proto._getEvents = function _getEvents() {
		return this._events || (this._events = {});
	};

	/**
	 * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
	 *
	 * @return {Function} Non conflicting EventEmitter class.
	 */
	EventEmitter.noConflict = function noConflict() {
		exports.EventEmitter = originalGlobalValue;
		return EventEmitter;
	};

	// Expose the class either via AMD, CommonJS or the global object
	if (typeof define === 'function' && define.amd) {
		define(function () {
			return EventEmitter;
		});
	}
	else if (typeof module === 'object' && module.exports){
		module.exports = EventEmitter;
	}
	else {
		this.EventEmitter = EventEmitter;
	}
}.call(this));

},{}],32:[function(_dereq_,module,exports){
module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[10])
(10)
});