var path = require('path');

module.exports = {
  context: __dirname,
  entry: {
    app: './app.js'
  },

  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'built'),
    devtool: '$@inline-source-map',
    libraryTarget: 'umd',
    publicPath: '../built/'
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel?optional[]=runtime&stage=0'
      }
    ]
  }
};
