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
