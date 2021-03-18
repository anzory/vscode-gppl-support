'use strict';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';
import * as fs from 'fs';
import { resolve } from 'path';
import { Compiler, Configuration } from 'webpack';

let dist = 'dist';
const config: Configuration = {
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: {
    main: './src/extension.ts'
  }, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  // devtool: 'nosources-source-map',
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve(__dirname, 'language'),
          to: 'language',
        },
        {
          from: resolve(__dirname, 'images/logo.png'),
          to: 'images',
        },
        {
          from: resolve(__dirname, 'images/icon.png'),
          to: 'images',
        },
        {
          from: resolve(__dirname, 'README.md'),
        },
        {
          from: resolve(__dirname, 'CHANGELOG.md'),
        },
        {
          from: resolve(__dirname, 'LICENSE.md'),
        },
      ],
    }),
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      apply: (Compiler: Compiler) => {
        Compiler.hooks.afterEmit.tap('writeDistPackageJson', () => {
          writeDistPackageJson();
        });
      },
    },
  ],
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules|tmp/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  }
};
module.exports = config;
//========================================================
function writeDistPackageJson() {
  let distPackageJson = JSON.parse(fs.readFileSync('./package.json').toString());
  delete distPackageJson.scripts;
  delete distPackageJson.devDependencies;
  distPackageJson.publisher = 'anzory';
  distPackageJson.name = 'vscode-gppl-support';
  distPackageJson.main = './main';
  fs.writeFile(
    resolve(__dirname, dist, 'package.json'),
    JSON.stringify(distPackageJson, null, ' '),
    'utf8',
    () => { }
  );
}
