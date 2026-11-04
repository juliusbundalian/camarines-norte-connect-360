import type { FirebaseOptions } from 'firebase/app';

export type FirebaseEnvironment = Partial<Record<
  'EXPO_PUBLIC_FIREBASE_API_KEY' | 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN' |
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID' | 'EXPO_PUBLIC_FIREBASE_APP_ID' |
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET' | 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID' |
  'EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL', string>>;
export interface FirebaseConfiguration { options: FirebaseOptions; emulatorUrl?: string }
export function readFirebaseConfig(env: FirebaseEnvironment, development: boolean): FirebaseConfiguration {
  const required = (key: keyof FirebaseEnvironment) => {
    const value = env[key]?.trim();
    if (!value) throw new Error(`Set ${key} in .env.local. See .env.example and docs/firebase-setup.md.`);
    return value;
  };
  const options: FirebaseOptions = {
    apiKey: required('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: required('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: required('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    appId: required('EXPO_PUBLIC_FIREBASE_APP_ID'),
    storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || undefined,
    messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || undefined,
  };
  const emulatorUrl = env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL?.trim() || undefined;
  if (emulatorUrl) {
    if (!development) throw new Error('Auth emulator configuration is forbidden in production builds.');
    try {
      const url = new URL(emulatorUrl);
      if (url.protocol !== 'http:' || !url.hostname || !url.port || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error();
    } catch { throw new Error('Auth emulator URL must be an HTTP host and explicit port, without a path or credentials.'); }
  }
  return { options, emulatorUrl };
}
// Expo replaces only static dot-property references to EXPO_PUBLIC variables.
export function getFirebaseConfiguration(): FirebaseConfiguration {
  return readFirebaseConfig({
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL,
  }, __DEV__);
}
