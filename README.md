monorouter
==========

monorouter is an isomorphic JavaScript router by [@matthewwithanm] and
[@lettertwo]. It was designed for use with ReactJS but doesn't have any direct
dependencies on it and should be easily adaptable to other virtual DOM
libraries.

While it can be used for both browser-only and server-only routing, it was
designed from the ground up to be able to route apps on both sides of the wire.

**Note: This project is in beta and we consider the API in flux. Let us know if
you have any ideas for improvement!**


Usage
-----

Defining a router looks like this:

```javascript
var monorouter = require('monorouter');
var reactRouting = require('monorouter-react');

monorouter()
  .setup(reactRouting())
  .route('/', function(req) {
    this.render(MyView);
  })
  .route('/pets/:name/', function(req) {
    this.render(PetView, {petName: req.params.name});
  });
```

The router can be used on the server with express and [connect-monorouter]:

```javascript
var express = require('express');
var router = require('./path/to/my/router');
var monorouterMiddleware = require('connect-monorouter');

var app = express();
app.use(monorouterMiddleware(router));

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
```

And in the browser:

```javascript
router
  .attach(document)
  .captureClicks(); // This is optional—it uses the router to handle normal links.
```

See [the examples][monorouter examples] for a more in-depth look and more
tricks!


API
---

In addition to the router itself, monorouter has two important objects. The
first one is the request object, and it's passed as the first argument to your
handler. The second is the context (`this`) of your route handler, and it's used
to interface with your application's state (you can think of this as being
similar to a Response object in server-only routers). This section summarizes
their APIs.


### Request

- **param(name:String)**: Get the value for one of the dynamic parts of your
  route:

  ```javascript
  monorouter()
    .route('/pets/:name', function(req) {
      console.log(req.param('name'));
      // snip
    });
  ```

- **params:Object**: A hash of the params used in your route.
- **canceled:Boolean**: A boolean that represents whether the request has been
  canceled. This is useful for preventing further action in async callbacks:

  ```javascript
  monorouter()
    .route('/', function(req) {
      http('...', function(err, result) {
        if (req.canceled) return;
        this.render(MyView, {person: result.people[0]});
      }.bind(this));
    });
  ```

  Note that it's not necessary to check this value if all you're doing is
  rendering since those operations are no-ops when the request has been
  canceled. The request is also an EventEmitter that emits a "cancel" event so,
  if you'd like to take action immediately when a request is canceled (and abort
  an XHR request, for example), you can do that:

  ```javascript
  monorouter()
    .route('/', function(req) {
      var xhr = http('...', function(err, result) {
        if (req.canceled) return;
        this.render(MyView, {person: result.people[0]});
      }.bind(this));
      this.on('cancel', function() {
        xhr.abort();
      });
    });
  ```

- **initialOnly:Boolean**: Indicates whether the request is only for the initial
  state of the app. `true` when rendering on the server.
- **location:Object**: A parsed version of the requested URL, in a format based
  on the [`document.location` interface][document.location].
- **url:String**: The requested URL.
- **protocol:String**: The protocol of the requested URL, without the colon.
  e.g. `"http"`
- **hostname:String**: The hostname of the requested URL, e.g. `'mysite.com'`
- **host:String**: The full host of the requested URL, e.g. `'mysite.com:5000'`
- **search:String**: The search portion of the requested URL, including the
  question mark, e.g. `'?hello=5&goodbye=a'`
- **querystring:String**: The search portion of the requested URL, excluding the
  question mark, e.g. `'hello=5&goodbye=a'`
- **query:Object**: A version of the query string that's been parsed using
  @sindresorhus's [query-string].
- **hash:String**: The hash portion of the requested URL, including the hash
  mark. e.g. `'#this-is-the-hash'`
- **fragment:String**: The hash portion of the requested URL, excluding the hash
  mark. e.g. `'this-is-the-hash'`


### Handler Context

Within a route handler, you use properties and methods of `this` to define the
application state. Here are some of those:

- **render(view:Function?, vars:Object?, callback:Function?)**: Render the view
  and consider the request complete. The `view` is a function that returns a
  virtual DOM instance. It may be omitted if you've previously set one for this
  request using `setView` (e.g. in middleware). "vars" are arguments for this
  function that will be bound to it for as long as it's rendered.
- **renderIntermediate(view:Function?, vars:Object?, callback:Function?)**: Like
  `render`, but doesn't end the request. This is useful if you'd like to render
  several different states during the course of handling a single route.
- **renderInitial(view:Function?, vars:Object?, callback:Function?)**: Like
  `render`, but only ends "initialOnly" requests.
- **setView(view:Function)**: Sets the view to be rendered for this response.
  The application won't actually be updated until/unless one of the `render*`
  methods is called.
- **setVars(vars:Object)**: Add vars for any subsequent renders in this request.
  "vars" are passed to the view function for rendering.
- **setState(state:Object)**: "state" is similar to vars in that its values are
  passed to the view for rendering. Unlike "vars", however, "state" is preserved
  between requests. Setting state also triggers a rerender of the current view.
  The state and vars are merged and the result passed to the view function.
- **notFound()**: A function that tells the server to send a 404 status code
  with this view.
- **doctype:String**: The doctype for the document. Defaults to the HTML5
  doctype.
- **contentType:String**: The content type of the document. Defaults to
  `'text/html; charset=utf-8'`
- **beforeRender(hook:Function)**: An interface for adding before-render hooks.
  All hooks are executed in parallel immediately prior to rendering.
- **ended:Boolean**: Specifies whether the response has ended.
- **initialEnded:Boolean**: Specifies whether the initial state has been rendered.


Philosophy
----------

If the original idea for [react-nested-router] was "[Ember] got it mostly
right," monorouter's can be said to be "[Express] got it mostly right." (Or
[koa]. Or [Flask]. Or [Django]. Or [Rails]…) Server-side routing is very easy: a
request comes in and, in response, you render a template. Each time this
happens, you render the entire document. Until recently, this approach seemed
incongruent with client-side rendering, but ReactJS and the virtual DOM have
changed that.

Still, client-side routing is fundamentally different than server-side in some
ways—most notably in that state can be shared between routes. monorouter aims to
expose the functionality related to GUI routing that's common to the server and
browser. Some principles of the project are:

1. The same routing that's used in the browser should be used to render the
   server response.
2. Routing is (at least potentially) an asynchronous process while rendering a
   view is a synchronous one.
3. Routes need not map to a single state (or view), but may result in any number
   of them throughout their life.
    * Two of these states are special: the "initial" state (which will be
      serialized and sent by the server and which the browser app must begin in)
      and the final state (which the app is in once the handling of a route is
      completed).
4. A view is any JavaScript function that returns a DOM descriptor.
5. Each view should represent the entire document at a given state—not just a
   portion of it.
   * Not only does this make reasoning about the application easier, it's very
     important when dealing with `<head>`s
6. We think monorouter covers all the possible use cases, and we see it as a
   foundation on which to build—both via extensions (i.e. middleware) and
   additional abstractions (i.e. JSX-friendly interfaces and declarative,
   lifecycle-centric route declarations).




[@matthewwithanm]: http://github.com/matthewwithanm
[@lettertwo]: http://github.com/lettertwo
[react-nested-router]: https://github.com/rpflorence/react-router
[Ember]: https://github.com/emberjs/ember.js
[Express]: https://github.com/visionmedia/express
[koa]: https://github.com/koajs/koa
[Flask]: https://github.com/mitsuhiko/flask
[Django]: https://github.com/django/django
[Rails]: https://github.com/rails/rails
[react-router-component]: https://github.com/andreypopp/react-router-component
[connect-monorouter]: https://github.com/matthewwithanm/connect-monorouter
[monorouter-react]: https://github.com/matthewwithanm/monorouter-react
[monorouter examples]: https://github.com/matthewwithanm/monorouter/tree/master/examples
[document.location]: https://developer.mozilla.org/en-US/docs/Web/API/document.location
[query-string]: https://github.com/sindresorhus/query-string
