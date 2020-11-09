// webpack.config.js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackPartialsPlugin = require('html-webpack-partials-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const packageJson = require('./package.json')
const mode = process.env.NODE_ENV || 'development'
const isDevelopment = mode === 'development'

const plugins = [
  new HtmlWebpackPlugin({
    title: packageJson.name || 'title',
    favicon: 'assets/favicon.ico',
    meta: {
      description: packageJson.description || 'description',
      version: packageJson.version,
    },
    templateContent: ({ htmlWebpackPlugin }) => `
    <!doctype html>
      <html lang="${htmlWebpackPlugin.options.lang || 'en'}">
      <head>
        <meta charset="UTF-8">
        <title>${htmlWebpackPlugin.options.title}</title>
      </head>
      <body></body>
    </html>
  `,
  }),
  new HtmlWebpackPartialsPlugin({
    path: 'src/html/body.html',
  }),
  new CleanWebpackPlugin(),
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
    port: 9000,
  },
}
