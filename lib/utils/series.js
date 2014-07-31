var noop = require('./noop');

/**
 * Invoke each in a list of functions using continuation passing.
 */
function series(funcs, ctx, args, callback) {
  var nextFunc = funcs[0];
  callback = callback || noop;

  if (nextFunc) {
    var remaining = funcs.slice(1);
    var next = function(err) {
      if (err) {
        callback(err);
      } else {
        // Call the remaining funcs
        series(remaining, ctx, args, callback);
      }
    };

    try {
      nextFunc.apply(ctx, args.concat(next));
    } catch (err) {
      callback(err);
    }
  } else {
    callback();
  }
}

module.exports = series;
