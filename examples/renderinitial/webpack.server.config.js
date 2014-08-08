var path = require('path');

module.exports = {
  context: __dirname,
  entry: {
    server: './server.js'
  },
  externals: ['express', 'react'],
  target: 'node',
  node: {
    console: false,
    process: false,
    global: false,
    buffer: false,
    __filename: false,
    __dirname: false
  },

  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'built'),
    devtool: '$@inline-source-map',
    libraryTarget: 'commonjs2',
    publicPath: '../built/'
  },

  module: {
    loaders: [
      {test: /\.js$/, loader: 'jsx'}
    ]
  }
};
