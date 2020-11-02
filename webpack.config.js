// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const packageJson = require('./package.json');

module.exports = {
    mode: process.env.NODE_ENV || `development`,
    ...(process.env.NODE_ENV === 'production' ? {

        } : {
        devtool: 'inline-source-map',
    }),
    entry: {
        app: './src/js/index.js',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: packageJson.name || 'title',
            meta: { description: packageJson.description || 'description', version: packageJson.version }
        })
    ],
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000,
        open: true
    }
};
