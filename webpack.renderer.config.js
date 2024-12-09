const path  = require('path');
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
  test: /(\.html|\.mcm|hex_parser.js)$/,
  use: [{loader: 'raw-loader'}]
},
{
  test: /\.(png|svg|gltf|glb)$/,
  include: [
    path.join(__dirname, 'images/flightindicators'),
    path.join(__dirname, 'resources'),
    path.join(__dirname, 'images/icons/map'),
  ],
  use: [{loader: 'file-loader'}]
},
{
  test: /\.bin$/,
  type: "asset/resource",
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
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  resolve: {
    fallback: {
      "fs": require.resolve("browserify-fs"),
      'child_process': false
    }    
  }
};
