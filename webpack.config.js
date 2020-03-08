const { entry, output, rules, plugins } = require('./webpack.base.config');

const config =  {
    mode: 'development',
    devtool: 'inline-source-map',
    entry,
    output,
    module: {
        rules,
    },
    plugins,
    resolve: {
        alias: {
            vue: 'vue/dist/vue.js',
        },
    },
    devServer: {
        publicPath: '/javascripts/',
        stats: 'minimal',
        port: 8080,
        proxy: {
            '/': 'http://localhost:3001',
        },
    },
};

module.exports = config;
