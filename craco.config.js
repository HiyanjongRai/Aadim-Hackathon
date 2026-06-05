const path = require('path');

// List packages to transpile from node_modules because they ship ESM builds
const esModules = [
  'ajv',
  'ajv-keywords',
  'axios',
  'colorette',
  'yaml',
  '@babel/runtime'
];

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const includePaths = esModules.map((pkg) => path.resolve(__dirname, 'node_modules', pkg));

      // Add rule to transpile these modules with babel-loader
      webpackConfig.module.rules.unshift({
        test: /\.m?js$/,
        include: includePaths,
        use: {
          loader: require.resolve('babel-loader'),
          options: {
            presets: [require.resolve('@babel/preset-env')],
            sourceType: 'unambiguous'
          }
        }
      });

      return webpackConfig;
    }
  }
};
