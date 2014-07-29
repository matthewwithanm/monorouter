var path = require('path');
var webpack = require('webpack');
// var fs = require('fs');
// 
// 
// function getEntry(isServer) {
//   if (isServer) {
//     return {server: './server.js'}
//   } else {
//     return {browser: './browser.js'};
//   };
// };
// 
// function getExternals(isServer) {
//   if (isServer) {
//     return fs
//       .readdirSync(path.resolve('node_modules'))
//       .map(function (dir) {
//         return new RegExp('^' + dir + '(?:$|\/)');
//       });
//   } else {
//     return null;
//   }
// }
// 
// module.exports = function(isServer) {
//   return {
//     context: __dirname,
//     entry: getEntry(isServer),
//     externals: getExternals(isServer),
// 
//     output: {
//       filename: '[name].js',
//       chunkFilename: '[id].chunk.js',
//       path: path.join(__dirname, 'built'),
//       devtool: '$@inline-source-map',
//       libraryTarget: 'umd',
//       publicPath: '../built/'
//     },
// 
//     module: {
//       loaders: [
//         {test: /query-string\.js$/, loader: 'imports?define=>null'},
//         {test: /\.js$/, loader: 'jsx'}
//       ]
//     }
//   }
// };
module.exports = {
  context: __dirname,
  entry: {
    server: './server.js'
  },
  externals: ['express', 'react'],
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
