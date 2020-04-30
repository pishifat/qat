const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
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
        discussionVote: './src/discussionVote.js',
        qualityAssurance: './src/qualityAssurance.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'public/javascripts/'),
        publicPath: '/javascripts/',
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
            test: /\.(png|svg|jpg|gif)$/,
            use: [{
                loader: 'file-loader',
                options: {
                    outputPath: '../images',
                },
            }],
        },
        {
            test: /\.css$/,
            use: ['vue-style-loader', 'css-loader'],
        },
    ],
    plugins: [
        new VueLoaderPlugin(),
    ],
};
