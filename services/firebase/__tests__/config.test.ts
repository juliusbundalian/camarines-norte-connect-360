import { readFirebaseConfig } from '../config';
const env = {
  EXPO_PUBLIC_FIREBASE_API_KEY: 'demo-key',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-cn360-connect.firebaseapp.com',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'demo-cn360-connect',
  EXPO_PUBLIC_FIREBASE_APP_ID: 'demo-app',
};
test('reports the missing environment field', () => {
  expect(() => readFirebaseConfig({}, true)).toThrow(/EXPO_PUBLIC_FIREBASE_API_KEY/);
});
test('parses required configuration without enabling the emulator by default', () => {
  expect(readFirebaseConfig(env, true)).toMatchObject({ options: {projectId: 'demo-cn360-connect'}, emulatorUrl: undefined });
});
test('allows an explicit development emulator', () => {
  expect(readFirebaseConfig({...env, EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099'}, true).emulatorUrl).toBe('http://127.0.0.1:9099');
});
test.each(['no-host', 'https://host:9099', 'http://host:9099/path', 'http://user:pass@host:9099'])('rejects invalid emulator URL %s', url => {
  expect(() => readFirebaseConfig({...env, EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: url}, true)).toThrow(/emulator/i);
});
test('rejects emulator configuration in production', () => {
  expect(() => readFirebaseConfig({...env, EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: 'http://localhost:9099'}, false)).toThrow(/emulator/i);
});
test('permits production configuration without an emulator', () => {
  expect(readFirebaseConfig(env, false).emulatorUrl).toBeUndefined();
});
