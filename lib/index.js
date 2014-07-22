var Router = require('./Router');

function monorouter(opts) {
  return new Router(opts);
}

monorouter.renderInto = require('./renderInto');

module.exports = monorouter;
