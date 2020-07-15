const path = require('path');
require('dotenv').config();
const HtmlWebPackPlugin = require("html-webpack-plugin");
const webpack = require('webpack');

module.exports = {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader",
            options: { minimize: true }
          }
        ]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: "file-loader"
          }
        ]
      },
      {
        test: /\.s?css$/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              implementation: require('sass')
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "./index.html",
      favicon: './favicon.ico'
    }),
    new webpack.DefinePlugin({
      PROCESS: JSON.stringify(process.env.PROCESS),
      G_CLIENT_ID: JSON.stringify(process.env.GOOGLE_CLIENT_ID),
      G_API_KEY_DEV: JSON.stringify(process.env.GOOGLE_API_KEY_DEV),
      G_API_KEY_PROD: JSON.stringify(process.env.GOOGLE_API_KEY_PROD)
    })
  ]
};