// TODO: Rename this and use it to invoke all middleware functions.
// TODO: Add a timeout.

/**
 * Invoke each handler in turn until the list is exhausted or the request has
 * been ended.
 */
function invokeHandlers(handlers, req, callback) {
  var nextHandler = handlers[0];
  var remaining = handlers.slice(1);

  var next = function(err) {
    if (err) {
      callback(err);
    } else if (req.isComplete) {
      // The request has finished; we're done.
      callback();
    } else {
      // Call the remaining handlers.
      invokeHandlers(remaining, req, callback);
    }
  };

  try {
    nextHandler(req, next);
  } catch (err) {
    callback(err);
  }
}

module.exports = invokeHandlers;
