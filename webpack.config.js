// webpack.config.js
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const packageJson = require('./package.json')
const mode = process.env.NODE_ENV || 'development'
const isDevelopment = mode === 'development'

let devServer = null // set below in devserver part

class HotReloadHtml {
  constructor () {
    this.name = 'HotReloadHtml'
    this.cache = {}
  }

  apply (compiler) {
    compiler.hooks.compilation.tap(this.name, compilation => {
      HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tap(this.name, (data) => {
        const orig = this.cache[data.outputName]
        const html = data.html
        if (devServer && orig && orig !== html) {
          devServer.sockWrite(devServer.sockets, 'content-changed')
        }
        this.cache[data.outputName] = html
      })
    })
  }
}

const plugins = [
  new HtmlWebpackPlugin({
    title: packageJson.name || 'title',
    favicon: 'assets/favicon.ico',
    meta: {
      viewport: 'width=device-width, initial-scale=1.0',
      description: packageJson.description || 'description',
      version: packageJson.version,
    },
    body: './body.html',
    template: path.resolve(__dirname, './src/html/html.js'),
  }),
  new HotReloadHtml(),
  new webpack.HotModuleReplacementPlugin(),
  new CleanWebpackPlugin(),
  new webpack.DefinePlugin({
    __VERSION__: packageJson.version,
  }),
]
if (!isDevelopment) {
  plugins.push(new MiniCssExtractPlugin({
    filename: '[name].[contenthash].css',
    chunkFilename: '[id].[contenthash].css',
  }))
}

module.exports = {
  mode,
  ...(isDevelopment
    ? {
        devtool: 'inline-source-map',
      }
    : {}),
  entry: {
    main: [
      path.resolve(__dirname, './src/js/index.js'),
      path.resolve(__dirname, './src/scss/style.scss'),
    ],
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: '[name].[contenthash].js',
  },
  module: {
    rules: [
      // html
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
      // JavaScript
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      // Images
      {
        test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
        type: 'asset/resource',
      },
      // Fonts and SVGs
      {
        test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
        type: 'asset/inline',
      },
      // CSS, PostCSS, and Sass
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
    ],
  },
  plugins,
  devServer: {
    historyApiFallback: true,
    contentBase: path.resolve(__dirname, './public'),
    open: true,
    compress: true,
    hot: true,
    watchContentBase: true,
    port: 9000,
    before (app, server) {
      devServer = server
    },
  },
}
