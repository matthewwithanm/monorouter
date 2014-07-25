/**
 * Invoke each handler in turn until the list is exhausted or the request has
 * been ended.
 */
function invokeHandlers(handlers, req, res, callback) {
  var nextHandler = handlers[0];

  if (nextHandler) {
    var remaining = handlers.slice(1);
    var next = function(err) {
      if (err) {
        callback(err);
      } else {
        // Call the remaining handlers.
        invokeHandlers(remaining, req, res, callback);
      }
    };

    try {
      nextHandler.call(res, req, next);
    } catch (err) {
      callback(err);
    }
  } else {
    callback();
  }
}

module.exports = invokeHandlers;
