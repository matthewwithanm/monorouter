var Router = require('./Router');

function monorouter(opts) {
  return Router.extend(opts);
}

monorouter.renderInto = require('./renderInto');

module.exports = monorouter;
