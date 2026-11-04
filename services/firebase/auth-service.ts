import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";
import { getErrorCode } from "../../features/auth/errors";
export interface AuthService {
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  logout(): Promise<void>;
  observe(
    next: (user: User | null) => void,
    error: (error: unknown) => void,
  ): Unsubscribe;
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
