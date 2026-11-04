import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { initializeApp, deleteApp } from "firebase/app";
import {
  initializeAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signOut,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
assert.match(
  host ?? "",
  /^(127\.0\.0\.1|localhost):\d+$/,
  "Run through npm run test:emulator; only loopback emulators are allowed.",
);
const projectId = "demo-cn360-connect";
Object.assign(process.env, {
  EXPO_PUBLIC_FIREBASE_API_KEY: "demo-key",
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: projectId,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`,
  EXPO_PUBLIC_FIREBASE_APP_ID: "demo-app",
  EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: `http://${host}`,
});
globalThis.__DEV__ = true;
const { getAuthService } = await import("../services/firebase/auth-service.ts");
const { getFirebaseAuth, getFirebaseApp } =
  await import("../services/firebase/client.ts");
const service = getAuthService();
const email = `auth-${randomUUID()}@example.com`;
const password = "Example password 123";
const credentialFailure = (error) =>
  [
    "auth/invalid-credential",
    "auth/wrong-password",
    "auth/invalid-login-credentials",
  ].includes(error.code);
after(async () => {
  await deleteApp(getFirebaseApp());
});

test("real application service registers, rejects duplicates, signs out, and logs in", async () => {
  await service.register(` ${email} `, password);
  assert.equal(getFirebaseAuth().currentUser?.email, email);
  await assert.rejects(service.register(email, password), {
    code: "auth/email-already-in-use",
  });
  await service.logout();
  assert.equal(getFirebaseAuth().currentUser, null);
  await assert.rejects(
    service.login(email, "incorrect password"),
    credentialFailure,
  );
  await service.login(email, password);
  assert.equal(getFirebaseAuth().currentUser?.email, email);
});
test("real reset requests support the default hosted-reset action", async () => {
  await service.logout();
  await service.requestPasswordReset(email);
  await service.requestPasswordReset(`missing-${randomUUID()}@example.com`);
  const response = await fetch(
    `http://${host}/emulator/v1/projects/${projectId}/oobCodes`,
  );
  assert.equal(response.status, 200);
  const { oobCodes } = await response.json();
  const reset = oobCodes.find(
    (code) => code.email === email && code.requestType === "PASSWORD_RESET",
  );
  assert.ok(
    reset?.oobCode,
    "The emulator must generate a reset code for the registered user.",
  );
  assert.equal(
    await verifyPasswordResetCode(getFirebaseAuth(), reset.oobCode),
    email,
  );
  await confirmPasswordReset(
    getFirebaseAuth(),
    reset.oobCode,
    "Updated password 456",
  );
  await assert.rejects(service.login(email, password), credentialFailure);
  await service.login(email, "Updated password 456");
  assert.equal(getFirebaseAuth().currentUser?.email, email);
  await service.logout();
});
test("Firebase React Native persistence adapter restores a fresh auth instance", async () => {
  // Test-only access to the SDK's native distribution: Node resolves its own
  // condition before react-native. The shipped app uses the public native export.
  const require = createRequire(import.meta.url);
  const rnEntry = join(
    dirname(require.resolve("@firebase/auth/package.json")),
    "dist/rn/index.js",
  );
  const { getReactNativePersistence } = await import(
    pathToFileURL(rnEntry).href
  );
  const values = new Map();
  const storage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    removeItem: async (key) => {
      values.delete(key);
    },
  };
  const options = { apiKey: "demo-key", projectId, appId: "persistence-demo" };
  const name = `persistence-${randomUUID()}`;
  let app = initializeApp(options, name);
  let auth = initializeAuth(app, {
    persistence: getReactNativePersistence(storage),
  });
  connectAuthEmulator(auth, `http://${host}`, { disableWarnings: true });
  await auth.authStateReady();
  const saved = await createUserWithEmailAndPassword(
    auth,
    `persistence-${randomUUID()}@example.com`,
    password,
  );
  const uid = saved.user.uid;
  assert.ok(values.size > 0);
  await deleteApp(app);
  app = initializeApp(options, name);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(storage),
  });
  connectAuthEmulator(auth, `http://${host}`, { disableWarnings: true });
  await auth.authStateReady();
  assert.equal(auth.currentUser?.uid, uid);
  await signOut(auth);
  await deleteApp(app);
});
