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
6. monorouter should cover all the basic functionality, but encourage extensions
   (i.e. via middleware) and additional abstractions (i.e. JSX-friendly
   interfaces).




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
