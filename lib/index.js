var Router = require('./Router');

function monorouter(opts) {
  return new Router(opts);
}

module.exports = monorouter;
