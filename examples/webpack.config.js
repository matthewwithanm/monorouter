var path = require('path');
var fs = require('fs');

function buildEntries() {
  return fs.readdirSync(__dirname).reduce(function(entries, dir) {
    if (dir === 'build') {
      return entries;
    }
    var isDraft = dir.charAt(0) === '_';
    if (!isDraft && fs.lstatSync(path.join(__dirname, dir)).isDirectory()) {
      entries[dir] = './' + path.join(dir, 'app.js');
    }
    return entries;
  }, {});
}
module.exports = {
  context: __dirname,
  entry: buildEntries(),
  externals: ['react'],

  output: {
    filename: '[name].js',
    chunkFilename: '[id].chunk.js',
    path: path.join(__dirname, 'build'),
    devtool: '$@inline-source-map',
    libraryTarget: 'umd',
    publicPath: '../build/'
  },

  module: {
    loaders: [
      {test: /query-string\.js$/, loader: 'imports?define=>null'},
      {test: /\.js$/, loader: 'jsx'}
    ]
  }
};
