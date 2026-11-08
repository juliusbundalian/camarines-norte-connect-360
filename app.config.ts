import type { ExpoConfig } from "expo/config";
const config: ExpoConfig = {
  name: "CamNorte 360",
  slug: "camarines-norte-connect-360",
  version: "1.0.0",
  scheme: "cn360connect",
  orientation: "default",
  userInterfaceStyle: "light",
  icon: "./assets/app-icon.png",
  ios: { supportsTablet: true, bundleIdentifier: "ph.cn360connect.app" },
  android: {
    package: process.env.ANDROID_APP_ID || "ph.cn360connect.app",
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FAFAF7",
    },
  },
  web: { bundler: "metro", output: "single", favicon: "./assets/brand.png" },
  plugins: [
    "expo-router",
    "@react-native-community/datetimepicker",
    ["expo-build-properties", { android: { kotlinVersion: "2.4.20" } }],
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
    [
      "expo-font",
      {
        fonts: [
          "./assets/fonts/Poppins-Regular.ttf",
          "./assets/fonts/Poppins-Medium.ttf",
          "./assets/fonts/PublicSans-Regular.ttf",
          "./assets/fonts/PublicSans-Medium.ttf",
        ],
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-logo.png",
        imageWidth: 160,
        backgroundColor: "#FAFAF7",
      },
    ],
  ],
};
export default config;
