/**
 * We support a few different handler signatures. This utility smooths over the
 * differences. Valid handler signatures are:
 *
 * - `()`
 *     - No arguments means a synchronous handler. Use `this` to read
 *       request properties and manipulate the response.
 * - `(done)`
 *     - A single argument means the handler is async. A callback is
 *       passed and can be invoked when the navigation is complete.
 *       Use `this` to read request properties and manipulate the
 *       response.
 * - `(req, res)`
 *     - Like the no-argument option, but a Request and Response
 *       object are passed. This is useful if you're handler is pre-
 *       bound, making `this` unsuitable for use reading request
 *       properties and manipulating the response.
 * - `(req, res, done)`
 *     - An async version of the two-argument option.
 */
function invokeHandler(handler, ctx, callback) {
  var error;
  var handlerIsAsync;
  var req = ctx.request;
  var res = ctx.response;

  try {
    switch (handler.length) {
    case 0:
      handler.call(ctx);
      break;
    case 1:
      handlerIsAsync = true;
      handler.call(ctx, cb);
      break;
    case 2:
      handler.call(ctx, req, res);
      break;
    case 3:
      handlerIsAsync = true;
      handler.call(ctx, req, res, cb);
      break;
    }
  } catch (err) {
    error = err;
  }

  if (!handlerIsAsync || error) {
    // Invoke the callback. (`error` may be null if a synchronous
    // handler was used and didn't error.)
    callback(error);
  }
}

module.exports = invokeHandler;
