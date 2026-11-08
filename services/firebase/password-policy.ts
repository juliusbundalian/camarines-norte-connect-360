import { validatePassword, type PasswordValidationStatus } from "firebase/auth";
import { getFirebaseAuth } from "./client";

export function checkPasswordPolicy(
  password: string,
): Promise<PasswordValidationStatus> {
  return validatePassword(getFirebaseAuth(), password);
}
