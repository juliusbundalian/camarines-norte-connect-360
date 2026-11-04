// Metro selects .native.ts or .web.ts; Node tooling has a browser-safe fallback.
export { getFirebaseApp, getFirebaseAuth, getFirestoreDb } from "./client.web";
