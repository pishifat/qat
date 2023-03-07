const { entry, output, rules, plugins } = require('./webpack.base.config');

const config =  {
    mode: 'development',
    devtool: 'eval-cheap-source-map',
    entry,
    output,
    module: {
        rules: [
            ...rules,
        ],
    },
    plugins,
    resolve: {
        alias: {
            vue: 'vue/dist/vue.esm.js',
        },
    },
    devServer: {
        devMiddleware: {
            stats: 'minimal',
        },
        static: './public',
        port: 8080,
        hot: true,
        proxy: {
            '/': 'http://localhost:3001',
        },
    },
};

module.exports = config;
