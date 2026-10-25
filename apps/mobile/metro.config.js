const { getDefaultConfig } = require("expo/metro-config");

/**
 * Expo's default Metro config already supports pnpm workspace symlinks.
 * Keep this file minimal so Metro can traverse nested package dependencies.
 */
module.exports = getDefaultConfig(__dirname);
