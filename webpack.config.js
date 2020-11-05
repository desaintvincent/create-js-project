// webpack.config.js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const packageJson = require('./package.json')
const isDevelopment = process.env.NODE_ENV === 'development'

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  ...(isDevelopment
    ? {
        devtool: 'inline-source-map',
      }
    : {}),
  entry: {
    app: './src/js/index.js',
    style: './src/scss/style.scss',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          // Extract and save the final CSS.
          MiniCssExtractPlugin.loader,
          // Load the CSS, set url = false to prevent following urls to fonts and images.
          { loader: 'css-loader', options: { url: false, importLoaders: 1 } },
          // Add browser prefixes and minify CSS.
          { loader: 'postcss-loader'},
          // Load the SCSS/SASS
          { loader: 'sass-loader' },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: packageJson.name || 'title',
      favicon: 'assets/favicon.ico',
      meta: {
        description: packageJson.description || 'description',
        version: packageJson.version,
      },
      template: 'src/index.html',
    }),
    new MiniCssExtractPlugin({
      filename: isDevelopment ? '[name].css' : '[name].[hash].css',
      chunkFilename: isDevelopment ? '[id].css' : '[id].[hash].css',
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000,
    open: true,
  },
}
