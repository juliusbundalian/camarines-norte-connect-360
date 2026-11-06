import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";
import { getErrorCode } from "../../features/auth/errors";
import type { AuthService, PhoneAuthService } from "./auth-types";
export type { AuthService } from "./auth-types";
export function getPhoneAuthService(): PhoneAuthService {
  return {
    async requestCode() {
      throw { code: "auth/native-build-required" };
    },
    cancel() {},
  };
}
const service: AuthService = {
  async login(email, password) {
    await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  },
  async register(email, password) {
    await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
  },
  async requestPasswordReset(email) {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
    } catch (error) {
      if (getErrorCode(error) !== "auth/user-not-found") throw error;
    }
  },
  async logout() {
    await signOut(getFirebaseAuth());
  },
  observe(next, error) {
    return onAuthStateChanged(getFirebaseAuth(), next, error);
  },
};
export function getAuthService(): AuthService {
  return service;
}
