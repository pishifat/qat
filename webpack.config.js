const VueLoaderPlugin = require('vue-loader/lib/plugin');
const path = require('path');

const config = {
    mode: 'development', // TOCHANGE production
    module: {
        rules: [
            {
                test: /\.vue$/,
                exclude: /node_modules/,
                loader: 'vue-loader'
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        outputPath: '../images'
                    }
                }]
            },
            {
                test: /\.css$/,
                use: ['vue-style-loader', 'css-loader'],
            },
        ]
    },
    plugins: [
        new VueLoaderPlugin()
    ],
    resolve: {
        alias: {
            vue: 'vue/dist/vue.js' // TOCHANGE vue.min.js
        }
    },
    devServer: {
        publicPath: '/javascripts/',
        port: 8080,
        proxy: {
        '/': 'http://localhost:3001'
        }
    }
};

const qatConfig = Object.assign({}, config, {
    name: 'qat',
    entry: {
        appEval: './src/appEval.js',
        bnEval: './src/bnEval.js',
        dataCollection: './src/dataCollection.js',
        evalArchive: './src/evalArchive.js',
        manageReports: './src/manageReports.js',
        users: './src/users.js',
        vetoes: './src/vetoes.js',
        manageTest: './src/manageTest.js',
        testResults: './src/testResults.js',
        testSubmission: './src/testSubmission.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'public/javascripts/'),
        publicPath: '/'
    },
});

module.exports = [
    qatConfig,
];
