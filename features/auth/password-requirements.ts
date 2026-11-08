import type { PasswordPolicy } from "firebase/auth";

export interface PasswordRequirement {
  key: string;
  label: string;
  met: boolean;
}
export function getPasswordRequirements(policy: PasswordPolicy, password: string): readonly PasswordRequirement[] {
  const options = policy.customStrengthOptions;
  const minimum = Math.max(8, options.minPasswordLength ?? 8);
  const rules: PasswordRequirement[] = [
    { key: "minLength", label: `At least ${minimum} characters`, met: password.length >= minimum },
  ];
  if (options.maxPasswordLength) rules.push({ key: "maxLength", label: `No more than ${options.maxPasswordLength} characters`, met: password.length > 0 && password.length <= options.maxPasswordLength });
  if (options.containsUppercaseLetter) rules.push({ key: "uppercase", label: "An uppercase letter", met: /[A-Z]/.test(password) });
  if (options.containsLowercaseLetter) rules.push({ key: "lowercase", label: "A lowercase letter", met: /[a-z]/.test(password) });
  if (options.containsNumericCharacter) rules.push({ key: "number", label: "A number", met: /[0-9]/.test(password) });
  if (options.containsNonAlphanumericCharacter) rules.push({ key: "symbol", label: "A special character", met: [...password].some(c => policy.allowedNonAlphanumericCharacters.includes(c)) });
  return rules;
}
