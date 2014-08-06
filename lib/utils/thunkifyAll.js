/**
 * Return thunkified versions of the provided functions bound to the specified
 * context and with the provided initial args.
 */
function thunkifyAll(fns, thisArg, args) {
  fns = fns || [];
  return fns.map(function(fn) {
    return function(done) {
      var newArgs = args || [];
      if (arguments.length) newArgs.push.apply(newArgs, arguments);
      newArgs.push(done);
      fn.apply(thisArg, newArgs);
    };
  });
}

module.exports = thunkifyAll;
