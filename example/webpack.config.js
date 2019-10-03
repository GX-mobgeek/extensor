const path = require('path');

module.exports = {
    watch: true,
    mode: 'production',
    entry: path.resolve(__dirname, './client.js'),
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    output: {
        filename: 'client.js',
        path: path.resolve(__dirname, './dist')
    }
};