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
