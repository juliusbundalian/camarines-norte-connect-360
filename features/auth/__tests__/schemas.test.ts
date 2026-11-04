import {
  loginSchema,
  registrationSchema,
  resetPasswordSchema,
} from "../schemas";
import { getAuthErrorMessage } from "../errors";
const fields = {
  email: " a@example.com ",
  password: " pässword ",
  confirmPassword: " pässword ",
};
test("trims email and preserves password bytes", () => {
  expect(registrationSchema.parse(fields)).toEqual({
    ...fields,
    email: "a@example.com",
  });
});
test.each(["", "bad", "a@"])("rejects invalid email %s", (email) => {
  expect(resetPasswordSchema.safeParse({ email }).success).toBe(false);
});
test("enforces registration minimum and matching confirmation", () => {
  expect(
    registrationSchema.safeParse({
      ...fields,
      password: "1234567",
      confirmPassword: "1234567",
    }).success,
  ).toBe(false);
  expect(
    registrationSchema.safeParse({
      ...fields,
      password: "12345678",
      confirmPassword: "12345678",
    }).success,
  ).toBe(true);
  expect(
    registrationSchema.safeParse({ ...fields, confirmPassword: "different" })
      .success,
  ).toBe(false);
});
test("login accepts existing short passwords but requires a password", () => {
  expect(loginSchema.safeParse({ ...fields, password: "short" }).success).toBe(
    true,
  );
  expect(loginSchema.safeParse({ ...fields, password: "" }).success).toBe(
    false,
  );
});
test("credential failures are neutral and unknown failures hide SDK details", () => {
  expect(getAuthErrorMessage({ code: "auth/wrong-password" })).toBe(
    getAuthErrorMessage({ code: "auth/user-not-found" }),
  );
  expect(
    getAuthErrorMessage(new Error("private internal details")),
  ).not.toContain("private internal details");
  expect(getAuthErrorMessage({ code: "auth/network-request-failed" })).toMatch(
    /connection/i,
  );
  expect(getAuthErrorMessage({ code: "auth/email-already-in-use" })).toMatch(
    /already/i,
  );
});
