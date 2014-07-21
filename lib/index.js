var monorouter = {
  Router: require('./Router'),
  getHistory: require('./history/getHistory'),
  Route: require('./Route'),
  Unhandled: require('./errors/Unhandled')
};

module.exports = monorouter;
