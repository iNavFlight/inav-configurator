module.exports = {
  entry: './js/main.js',
  module: {
    rules: require('./webpack.rules'),
  },
  node: { __dirname: true },
  externals: { 
    serialport: "commonjs2 serialport"
  }
};
