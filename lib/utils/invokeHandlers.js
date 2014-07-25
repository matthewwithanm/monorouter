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
        res['throw'](err);
        callback(err);
      } else if (res.ended) {
        // The request has finished; we're done.
        callback();
      } else {
        // Call the remaining handlers.
        invokeHandlers(remaining, req, res, callback);
      }
    };

    try {
      nextHandler.call(res, req, next);
    } catch (err) {
      res['throw'](err);
      callback(err);
    }
  } else {
    callback();
  }
}

module.exports = invokeHandlers;
