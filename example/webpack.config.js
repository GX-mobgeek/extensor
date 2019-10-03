const path = require('path');

module.exports = {
    /*
     * for a reason that i don't know, watching mode it is stoping the cli run,
     * enable only if you doing some testing, in this case, you have to open another terminal
     * window and start the server manualy with npx nodemon ./example/server.js or the standard way
     */
    //watch: true,
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