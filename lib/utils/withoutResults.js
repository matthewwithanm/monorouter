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
