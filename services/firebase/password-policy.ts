import { initializeApp, deleteApp } from "firebase/app";
import {
  initializeAuth,
  inMemoryPersistence,
  connectAuthEmulator,
  validatePassword,
  type PasswordValidationStatus,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";

let probeId = 0;
export async function checkPasswordPolicy(
  password: string,
): Promise<PasswordValidationStatus> {
  const sessionAuth = getFirebaseAuth();
  // validatePassword caches per Auth instance, and rejection-triggered recaching
  // is asynchronous. A short-lived, unsigned-in instance gives this lookup fresh
  // requirements without touching the active session or private SDK internals.
  const app = initializeApp(
    sessionAuth.app.options,
    `password-policy-${Date.now()}-${++probeId}`,
  );
  try {
    const probe = initializeAuth(app, { persistence: inMemoryPersistence });
    probe.tenantId = sessionAuth.tenantId;
    const emulator = sessionAuth.emulatorConfig;
    if (emulator) {
      const host =
        emulator.host.includes(":") && !emulator.host.startsWith("[")
          ? `[${emulator.host}]`
          : emulator.host;
      connectAuthEmulator(
        probe,
        `${emulator.protocol}://${host}${emulator.port == null ? "" : `:${emulator.port}`}`,
        { disableWarnings: true },
      );
    }
    return await validatePassword(probe, password);
  } finally {
    await deleteApp(app);
  }
}
