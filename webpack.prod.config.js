const { entry, output, rules, plugins } = require('./webpack.base.config');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const config =  {
    mode: 'production',
    entry,
    output,
    module: {
        rules: [
            ...rules,
            {
                test: /\.s[ac]ss$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    'css-loader',
                    'sass-loader',
                ],
            },
        ],
    },
    plugins: [
        ...plugins,
        new MiniCssExtractPlugin({
            filename: '../css/[name].css',
        }),
    ],
    resolve: {
        alias: {
            vue: 'vue/dist/vue.min.js',
        },
    },
    stats: 'minimal',
};

module.exports = config;
