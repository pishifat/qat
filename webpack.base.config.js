const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: {
        app: './src/app.js',
        modRequests: './src/modRequests.js',
    },
    output: {
        path: path.resolve(__dirname, 'public/'),
        filename: 'js/[name].js',
        publicPath: '/',
    },
    rules: [
        {
            test: /\.vue$/,
            exclude: /node_modules/,
            loader: 'vue-loader',
        },
        {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
        },
        {
            test: /(\.s[ac]ss|\.css)$/i,
            use: [
                process.env.NODE_ENV !== 'production'
                    ? 'vue-style-loader'
                    : MiniCssExtractPlugin.loader,
                'css-loader',
                'sass-loader',
            ],
        },
    ],
    plugins: [
        new VueLoaderPlugin(),
    ],
};
