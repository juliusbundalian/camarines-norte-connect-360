import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'Camarines Norte 360 Connect', slug: 'camarines-norte-connect-360', version: '1.0.0', scheme: 'cn360connect',
  orientation: 'default', userInterfaceStyle: 'light', icon: './assets/brand.png',
  ios: { supportsTablet: true },
  android: { adaptiveIcon: { foregroundImage: './assets/brand.png', backgroundColor: '#FAFAF7' } },
  web: { bundler: 'metro', output: 'single', favicon: './assets/brand.png' },
  plugins: ['expo-router', ['expo-splash-screen', { image: './assets/brand.png', imageWidth: 160, backgroundColor: '#FAFAF7' }]],
};
export default config;
