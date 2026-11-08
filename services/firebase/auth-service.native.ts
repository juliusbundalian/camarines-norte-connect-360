import {
  onAuthStateChanged,
  verifyPhoneNumber,
  signInWithCredential,
  PhoneAuthProvider,
  signOut,
} from "@react-native-firebase/auth";
import { getAuthService as getLegacy } from "./auth-service.web";
import { getNativeAuth } from "./native-auth";
import { getErrorCode } from "../../features/auth/errors";
import type {
  AuthService,
  AuthUser,
  PhoneAuthService,
  PhoneConfirmation,
} from "./auth-types";
export type { AuthService } from "./auth-types";
const normalize = (
  u: { uid: string; email: string | null; phoneNumber: string | null; metadata?: {creationTime?:string} } | null,
): AuthUser | null =>
  u ? { uid: u.uid, email: u.email, phoneNumber: u.phoneNumber, source:"native", creationTimeMs: u.metadata?.creationTime && Number.isFinite(Date.parse(u.metadata.creationTime)) ? Date.parse(u.metadata.creationTime) : null } : null;
let generation = 0;
let confirming = false;
let hold = false;
const blockedUsers = new Set<string>();
let cancelPending: (() => void) | undefined;
const publish = new Set<(user: AuthUser | null) => void>();
function flush(user: AuthUser | null) {
  for (const next of publish) next(user);
}
const expired = () => ({ code: "auth/session-expired" });
const phoneService: PhoneAuthService = {
  cancel() {
    generation++;
    cancelPending?.();
    cancelPending = undefined;
  },
  async requestCode(phone, forceResend = false) {
    if (confirming) throw { code: "auth/too-many-requests" };
    phoneService.cancel();
    const version = generation;
    const auth = getNativeAuth();
    return new Promise<PhoneConfirmation>((resolve, reject) => {
      let verificationId: string | null = null,
        automatic = false,
        automaticCode: string | null = null;
      const timeout = setTimeout(
        () => reject({ code: "auth/network-request-failed" }),
        70000,
      );
      cancelPending = () => {
        clearTimeout(timeout);
        reject({ code: "auth/cancelled" });
      };
      const confirmation: PhoneConfirmation = {
        get automatic() {
          return automatic;
        },
        async confirm(code) {
          if (version !== generation) throw expired();
          if (confirming) throw { code: "auth/too-many-requests" };
          confirming = true;
          hold = true;
          try {
            // RNFB's native credential cache supports a null ID for instant verification.
            const credential = PhoneAuthProvider.credential(
              verificationId as string,
              automaticCode ?? code,
            );
            const result = await signInWithCredential(auth, credential);
            if (version !== generation || result.user.phoneNumber !== phone) {
              blockedUsers.add(result.user.uid);
              await signOut(auth);
              throw expired();
            }
            blockedUsers.delete(result.user.uid);
            hold = false;
            flush(normalize(result.user));
          } catch (error) {
            hold = false;
            flush(normalize(auth.currentUser));
            throw error;
          } finally {
            confirming = false;
          }
        },
      };
      try {
        verifyPhoneNumber(auth, phone, 60, forceResend).on(
          "state_changed",
          (snapshot) => {
            if (version !== generation) return;
            if (snapshot.state === "error") {
              clearTimeout(timeout);
              reject(snapshot.error);
              return;
            }
            if (snapshot.state === "sent" || snapshot.state === "verified") {
              verificationId = snapshot.verificationId;
              if (snapshot.state === "verified") {
                automatic = true;
                automaticCode = snapshot.code ?? null;
              }
              clearTimeout(timeout);
              resolve(confirmation);
            }
          },
          (error) => {
            clearTimeout(timeout);
            reject(error);
          },
        );
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  },
};
const service: AuthService = {
  login: (email, password) => getLegacy().login(email, password),
  register: (email, password) => getLegacy().register(email, password),
  requestPasswordReset: (email) => getLegacy().requestPasswordReset(email),
  async logout() {
    phoneService.cancel();
    const results = await Promise.allSettled([
      Promise.resolve().then(async () => {
        try {
          await signOut(getNativeAuth());
        } catch (error) {
          // RNFB rejects signOut for an already-empty native store. Email sessions
          // live in the JS store; that native result already meets logout's goal.
          if (getErrorCode(error) !== "auth/no-current-user") throw error;
        }
      }),
      Promise.resolve().then(() => getLegacy().logout()),
    ]);
    for (const r of results) if (r.status === "rejected") throw r.reason;
  },
  observe(next, error) {
    let active = true,
      nativeReady = false,
      legacyReady = false,
      nativeUser: AuthUser | null = null,
      legacyUser: AuthUser | null = null;
    const emit = () => {
      if (active && nativeReady && legacyReady && !hold)
        next(nativeUser ?? legacyUser);
    };
    const update = (u: AuthUser | null) => {
      nativeUser = u && blockedUsers.has(u.uid) ? null : u;
      nativeReady = true;
      emit();
    };
    publish.add(update);
    let nativeStop: (() => void) | undefined,
      legacyStop: (() => void) | undefined;
    try {
      nativeStop = onAuthStateChanged(
        getNativeAuth(),
        (u) => update(normalize(u)),
        error,
      );
      legacyStop = getLegacy().observe((u) => {
        legacyUser = u;
        legacyReady = true;
        emit();
      }, error);
    } catch (e) {
      active = false;
      publish.delete(update);
      nativeStop?.();
      throw e;
    }
    return () => {
      active = false;
      publish.delete(update);
      nativeStop?.();
      legacyStop?.();
    };
  },
};
export function getAuthService() {
  return service;
}
export function getPhoneAuthService() {
  return phoneService;
}
