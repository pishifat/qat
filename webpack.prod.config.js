const { entry, output, rules, plugins } = require('./webpack.base.config');

const config =  {
    mode: 'production',
    entry,
    output,
    module: {
        rules,
    },
    plugins,
    resolve: {
        alias: {
            vue: 'vue/dist/vue.min.js',
        },
    },
    stats: 'minimal',
};

module.exports = config;
