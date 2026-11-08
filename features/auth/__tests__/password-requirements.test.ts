import type { PasswordPolicy } from "firebase/auth";
import { getPasswordRequirements } from "../password-requirements";
const policy: PasswordPolicy = {
  customStrengthOptions: { minPasswordLength: 10, maxPasswordLength: 16, containsUppercaseLetter: true, containsLowercaseLetter: true, containsNumericCharacter: true, containsNonAlphanumericCharacter: true },
  allowedNonAlphanumericCharacters: "!@", enforcementState: "ENFORCE", forceUpgradeOnSignin: false,
};
test.each([
  ["Short1!", "minLength", false], ["Abcdefgh1!", "minLength", true],
  ["Abcdefghijklmnop1!", "maxLength", false], ["Abcdefgh1!", "maxLength", true],
  ["abcdefgh1!", "uppercase", false], ["ABCDEFGH1!", "lowercase", false],
  ["Abcdefghi!", "number", false], ["Abcdefgh12", "symbol", false],
  ["Abcdefgh1?", "symbol", false], ["Abcdefgh1@", "symbol", true],
] as const)("%s satisfies %s: %s", (password, key, met) => {
  expect(getPasswordRequirements(policy, password).find(rule => rule.key === key)?.met).toBe(met);
});
test("only configured optional rules apply, with the app's eight-character floor", () => {
  const relaxed = { ...policy, customStrengthOptions: { minPasswordLength: 6, containsUppercaseLetter: false } };
  expect(getPasswordRequirements(relaxed, "1234567")).toEqual([{ key: "minLength", label: "At least 8 characters", met: false }]);
  expect(getPasswordRequirements(relaxed, "12345678").every(rule => rule.met)).toBe(true);
});
test("a compliant candidate passes all rules; empty input fails length constraints", () => {
  expect(getPasswordRequirements(policy, "Abcdefgh1!").every(rule => rule.met)).toBe(true);
  expect(getPasswordRequirements(policy, "").find(rule => rule.key === "maxLength")?.met).toBe(false);
});
