// @ts-ignore
'use strict';
// import * as fs from 'fs';
import { resolve } from 'path';
import { Compiler, Configuration } from 'webpack';

const fs = require('fs');
const cp = require('copy-webpack-plugin');

let dist = 'dist';

const config: Configuration = {
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  // mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: {
    main: './src/extension.ts',
  }, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: resolve(__dirname, dist),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    clean: true,
  },
  // devtool: 'nosources-source-map',
  plugins: [
    new cp({
      patterns: [
        { from: './languages', to: 'languages' },
        { from: './images/icons/**.*', to: './' },
        { from: './images/**.png', to: './' },
        { from: './images/**.ico', to: './' },
        { from: './images/**.svg', to: './' },
        { from: './**.md', to: './' },
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
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules|tmp/,
        use: ['ts-loader'],
      },
    ],
  },

  optimization: {
    minimize: true,
    minimizer: [
      // For webpack@5 you can use the `...` syntax to extend existing minimizers
      // (i.e. `terser-webpack-plugin`), uncomment the next line
      `...`,
    ],
  },
  externals: {
    // the vscode-module is created on-the-fly and must be excluded.
    // Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    vscode: 'commonjs vscode',
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js'],
  },
};
module.exports = config;

//========================================================
function writeDistPackageJson(): void {
  let distPackageJson = JSON.parse(fs.readFileSync('./package.json').toString());
  delete distPackageJson.scripts;
  delete distPackageJson.devDependencies;
  distPackageJson.publisher = 'anzory';
  distPackageJson.name = 'vscode-gppl-support';
  distPackageJson.main = './main';
  fs.writeFile(resolve(__dirname, dist, 'package.json'), JSON.stringify(distPackageJson, null, ' '), 'utf8', () => {});
}
