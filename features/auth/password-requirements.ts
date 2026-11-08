import type { PasswordPolicy } from "firebase/auth";

export interface PasswordRequirement {
  key: string;
  label: string;
  met: boolean;
}
export function getPasswordRequirements(
  policy: PasswordPolicy,
  password: string,
): readonly PasswordRequirement[] {
  const options = policy.customStrengthOptions;
  const minimum = Math.max(8, options.minPasswordLength ?? 8);
  const rules: PasswordRequirement[] = [
    {
      key: "minLength",
      label: `Must be at least ${minimum} characters long`,
      met: password.length >= minimum,
    },
  ];
  if (options.maxPasswordLength)
    rules.push({
      key: "maxLength",
      label: `No more than ${options.maxPasswordLength} characters`,
      met: password.length > 0 && password.length <= options.maxPasswordLength,
    });
  if (options.containsUppercaseLetter)
    rules.push({
      key: "uppercase",
      label: "Must include at least one uppercase letter (A–Z)",
      met: /[A-Z]/.test(password),
    });
  if (options.containsLowercaseLetter)
    rules.push({
      key: "lowercase",
      label: "Must include at least one lowercase letter (a–z)",
      met: /[a-z]/.test(password),
    });
  if (options.containsNumericCharacter)
    rules.push({
      key: "number",
      label: "Must include at least one number (0–9)",
      met: /[0-9]/.test(password),
    });
  if (options.containsNonAlphanumericCharacter)
    rules.push({
      key: "symbol",
      label: "Must include at least one special character (e.g., !@#$%^&*)",
      met: [...password].some((c) =>
        policy.allowedNonAlphanumericCharacters.includes(c),
      ),
    });
  return rules;
}
