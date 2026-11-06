export function getErrorCode(error: unknown): string | undefined {
  return error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : undefined;
}
export function getAuthErrorMessage(error: unknown): string {
  switch (getErrorCode(error)) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect. Please try again.";
    case "auth/email-already-in-use":
      return "This email is already registered. Try logging in or resetting your password.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
    case "auth/password-does-not-meet-requirements":
      return "Your password does not meet the account requirements. Use at least 8 characters and check the configured password policy.";
    case "auth/network-request-failed":
      return "Check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a little before trying again.";
    case "auth/user-disabled":
      return "This account is disabled. Contact the application administrator.";
    case "auth/operation-not-allowed":
    case "auth/invalid-api-key":
    case "auth/app-not-authorized":
      return "Authentication is not configured correctly. Contact the application administrator.";
    default:
      return "We could not complete your request. Please try again.";
  }
}

export function getPhoneErrorMessage(error: unknown): string {
  switch (getErrorCode(error)) {
    case "auth/invalid-phone-number":
    case "auth/missing-phone-number":
      return "Enter a valid Philippine mobile number.";
    case "auth/invalid-verification-code":
    case "auth/missing-verification-code":
      return "The verification code is incorrect. Please try again.";
    case "auth/session-expired":
    case "auth/code-expired":
    case "auth/invalid-verification-id":
    case "auth/invalid-credential":
      return "This verification code has expired. Request a new code.";
    case "auth/network-request-failed":
      return "Check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait before requesting another code.";
    case "auth/quota-exceeded":
      return "SMS verification is temporarily unavailable. Please try again later.";
    case "auth/app-not-authorized":
    case "auth/invalid-app-credential":
    case "auth/app-verification-failed":
    case "auth/captcha-check-failed":
      return "We could not verify this app. Please try again or contact support.";
    case "auth/operation-not-allowed":
    case "auth/billing-not-enabled":
      return "SMS verification is not configured. Please contact support.";
    case "auth/native-build-required":
      return "Phone verification requires the native Android app.";
    case "auth/user-disabled":
      return "This account is disabled. Please contact support.";
    case "auth/cancelled":
      return "Verification was cancelled. Request a new code to continue.";
    default:
      return "We could not complete verification. Please try again.";
  }
}
