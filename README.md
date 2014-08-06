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
