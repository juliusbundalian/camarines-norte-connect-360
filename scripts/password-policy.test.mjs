import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// Install interception BEFORE importing Firebase: no request can reach a network.
let minimum = 8,
  policyRequests = 0,
  failNextPolicy = false;
let releaseRefresh, signalRefresh;
const refreshStarted = new Promise((resolve) => {
  signalRefresh = resolve;
});
const blockedRefresh = new Promise((resolve) => {
  releaseRefresh = resolve;
});
const urls = [];
const response = () =>
  new Response(
    JSON.stringify({
      customStrengthOptions: { minPasswordLength: minimum },
      enforcementState: "ENFORCE",
      schemaVersion: 1,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  urls.push(url);
  assert.equal(url.origin, "http://127.0.0.1:9098");
  if (url.pathname.endsWith("/passwordPolicy")) {
    if (failNextPolicy) {
      failNextPolicy = false;
      return new Response(
        JSON.stringify({ error: { message: "NETWORK_REQUEST_FAILED" } }),
        { status: 400 },
      );
    }
    if (++policyRequests === 2) {
      signalRefresh();
      return blockedRefresh;
    }
    return response();
  }
  if (url.pathname.endsWith("/accounts:signUp"))
    return new Response(
      JSON.stringify({
        error: { message: "PASSWORD_DOES_NOT_MEET_REQUIREMENTS" },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  throw new Error(`Unexpected intercepted path: ${url.pathname}`);
};
Object.assign(process.env, {
  EXPO_PUBLIC_FIREBASE_API_KEY: "demo-key",
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: "demo-policy-cache",
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-policy-cache.firebaseapp.com",
  EXPO_PUBLIC_FIREBASE_APP_ID: "demo-app",
  EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: "http://127.0.0.1:9098",
});
globalThis.__DEV__ = true;
const { getApps, deleteApp } = require("firebase/app");
const {
  validatePassword,
  createUserWithEmailAndPassword,
} = require("firebase/auth");
const { getFirebaseAuth } = await import("../services/firebase/client.ts");
const { checkPasswordPolicy } =
  await import("../services/firebase/password-policy.ts");
const auth = getFirebaseAuth();
after(async () => {
  releaseRefresh(response());
  await new Promise(setImmediate);
  await Promise.all(getApps().map(deleteApp));
});
test("fresh application requirements bypass a deferred SDK policy recache without changing the active auth instance", async () => {
  const password = "Example1!";
  assert.equal(
    (await validatePassword(auth, password)).passwordPolicy
      .customStrengthOptions.minPasswordLength,
    8,
  );
  minimum = 12;
  await assert.rejects(
    createUserWithEmailAndPassword(auth, "policy-test@example.com", password),
    { code: "auth/password-does-not-meet-requirements" },
  );
  await refreshStarted;
  // SDK's automatic recache is still blocked; immediate cached validation is stale.
  assert.equal(
    (await validatePassword(auth, password)).passwordPolicy
      .customStrengthOptions.minPasswordLength,
    8,
  );
  const result = await checkPasswordPolicy(password);
  assert.equal(
    result.passwordPolicy.customStrengthOptions.minPasswordLength,
    12,
  );
  assert.equal(result.isValid, false);
  assert.equal(getFirebaseAuth(), auth);
  assert.equal(auth.currentUser, null);
  assert.equal(getApps().length, 1, "temporary policy app must be cleaned up");
  assert.equal(
    urls.filter((url) => url.pathname.endsWith("/accounts:signUp")).length,
    1,
  );
});

test("failed fresh lookup cleans up its temporary Auth app", async () => {
  failNextPolicy = true;
  await assert.rejects(checkPasswordPolicy("Example1!"), {
    code: "auth/network-request-failed",
  });
  assert.equal(getApps().length, 1);
  assert.equal(getFirebaseAuth(), auth);
});
