const path = require('path');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

var config = {
  entry: './src/app.js',
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new Dotenv({systemvars: true}),
    new webpack.ProvidePlugin({
      noUiSlider: 'nouislider'
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  }
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.devtool = 'source-map';
  }
  
  return config;
};