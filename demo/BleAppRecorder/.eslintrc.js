module.exports = {
  root: true,
  extends: '@react-native-community',
  rules: {
    'jest/valid-expect': 'off',
  },
  overrides: [
    {
      files: './src/test/*.test.js',
      env: {
        'mocha': true,
      },
    },
  ],
};
