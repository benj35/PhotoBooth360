module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@services': './src/services',
          '@stores': './src/stores',
          '@components': './src/components',
          '@screens': './src/screens',
          '@types': './src/types',
          '@utils': './src/utils',
        },
      },
    ],
  ],
};
