const withMaps = require("react-native-maps/app.plugin").default;

module.exports = function withAndroidPropertyMap(config) {
  const key = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  return withMaps(config, { androidGoogleMapsApiKey: key });
};
