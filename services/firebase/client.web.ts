import { browserLocalPersistence, type Auth } from 'firebase/auth';
import { initializePersistentAuth } from './client-core';
export { getFirebaseApp, getFirestoreDb } from './client-core';
let auth: Auth | undefined;
export function getFirebaseAuth(): Auth { return auth ??= initializePersistentAuth(browserLocalPersistence); }
