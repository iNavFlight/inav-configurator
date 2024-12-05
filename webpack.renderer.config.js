const rules = require('./webpack.rules');
const webpack = require('webpack');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
},
{
  test: /messages\.json$/,
  type: 'javascript/auto',
  use: [{loader: 'raw-loader'}],
},
{
  test: /\.html$/,
  use: [{loader: 'raw-loader'}]
},
{
  test: /\.gltf$/,
  use: [{loader: 'file-loader'}]
},
{
  test: /switchery\.js$/,
  loader: 'string-replace-loader',
  options: {
     search: 'function FastClick(layer) {',
     replace: 'function FastClick(layer) {_fastClick.call(window,layer);};function _fastClick(layer){',
  },
},);


module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins: [
    new NodePolyfillPlugin(),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
    })
  ],
  resolve: {
    fallback: {
      "fs": require.resolve("browserify-fs"),
      'child_process': false
    }
  }
};
