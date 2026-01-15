module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';

  return {
    presets: isTest ? ['babel-preset-expo'] : ['babel-preset-expo', 'nativewind/babel'],
    // Must be listed last per Reanimated docs.
    plugins: isTest ? [] : ['react-native-reanimated/plugin'],
  };
};
