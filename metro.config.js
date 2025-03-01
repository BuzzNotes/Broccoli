// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolution for asset extensions
config.resolver.assetExts.push(
  // Adds support for `.png` files
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp'
);

module.exports = config; 