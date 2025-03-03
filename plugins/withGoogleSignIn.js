const { withAndroidManifest } = require('@expo/config-plugins');
const { getMainApplicationOrThrow } = require('@expo/config-plugins/build/android/Manifest');

/**
 * Add the Google Sign-In configuration to the Android manifest
 */
const withGoogleSignIn = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = getMainApplicationOrThrow(androidManifest);

    // Check if the Google Sign-In meta-data already exists
    const existingMetaData = mainApplication['meta-data']?.find(
      (item) => item.$['android:name'] === 'com.google.android.gms.version'
    );

    if (!existingMetaData) {
      // Add the meta-data element for Google Sign-In
      if (!mainApplication['meta-data']) {
        mainApplication['meta-data'] = [];
      }

      mainApplication['meta-data'].push({
        $: {
          'android:name': 'com.google.android.gms.version',
          'android:value': '@integer/google_play_services_version',
        },
      });
    }

    return config;
  });
};

module.exports = withGoogleSignIn; 