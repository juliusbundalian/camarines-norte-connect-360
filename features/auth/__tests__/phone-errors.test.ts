import { getPhoneErrorMessage } from "../errors";
test.each([
  ["invalid-phone-number", /valid Philippine/],
  ["invalid-verification-code", /incorrect/],
  ["session-expired", /expired/],
  ["code-expired", /expired/],
  ["network-request-failed", /connection/],
  ["too-many-requests", /wait/],
  ["quota-exceeded", /temporarily unavailable/],
  ["app-verification-failed", /verify this app/],
  ["captcha-check-failed", /verify this app/],
  ["billing-not-enabled", /not configured/],
  ["operation-not-allowed", /not configured/],
  ["user-disabled", /disabled/],
] as const)(
  "phone errors give recovery guidance for auth/%s",
  (code, expected) => {
    const message = getPhoneErrorMessage({
      code: `auth/${code}`,
      message: "sensitive server detail",
    });
    expect(message).toMatch(expected);
    expect(message).not.toContain("sensitive");
  },
);
test("unknown errors do not leak backend messages or account existence", () => {
  expect(
    getPhoneErrorMessage({
      code: "auth/internal-error",
      message: "private payload",
    }),
  ).toBe("We could not complete verification. Please try again.");
});
test("native internal billing failures show configuration guidance without server details", () => {
  expect(
    getPhoneErrorMessage({
      code: "auth/internal-error",
      message: "An internal error has occurred. [ BILLING_NOT_ENABLED ]",
    }),
  ).toBe("SMS verification is not configured. Please contact support.");
});
