import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseConfiguration } from './config';

export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(getFirebaseConfiguration().options);
}
export function initializePersistentAuth(persistence: Persistence | Persistence[]): Auth {
  // Validate production emulator restrictions even when Fast Refresh reuses the app.
  const { emulatorUrl } = getFirebaseConfiguration();
  const app = getFirebaseApp();
  let auth: Auth;
  try { auth = initializeAuth(app, { persistence }); }
  catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'auth/already-initialized')) throw error;
    auth = getAuth(app);
  }
  if (emulatorUrl && !auth.emulatorConfig) connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
  return auth;
}
export function getFirestoreDb() { return getFirestore(getFirebaseApp()); }
