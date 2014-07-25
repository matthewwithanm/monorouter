var Router = require('./Router');

function monorouter(opts) {
  return Router.extend(opts);
}

module.exports = monorouter;
