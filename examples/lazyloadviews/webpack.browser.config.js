var path = require('path');

module.exports = {
  context: __dirname,
  entry: {
    browser: './browser.js'
  },

  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'built', 'assets'),
    devtool: '$@inline-source-map',
    libraryTarget: 'umd',
    publicPath: '/assets/'
  },

  module: {
    loaders: [
      {test: /\.js$/, loader: 'jsx'}
    ]
  }
};
