import type { PasswordPolicy } from "firebase/auth";
import { StyleSheet, Text, View } from "react-native";
import Circle from "lucide-react-native/icons/circle";
import CircleCheck from "lucide-react-native/icons/circle-check";
import { authTokens as t } from "../../theme/auth";
import { authStyles as s } from "./AuthScaffold";

export function PasswordRequirements({ policy, password }: { policy: PasswordPolicy | null; password: string }) {
  if (!policy) return <Text style={s.small}>Password requirements will be checked when you register.</Text>;
  const options = policy.customStrengthOptions;
  const rules: { label: string; met: boolean }[] = [
    { label: `At least ${Math.max(8, options.minPasswordLength ?? 8)} characters`, met: password.length >= Math.max(8, options.minPasswordLength ?? 8) },
  ];
  if (options.maxPasswordLength) rules.push({ label: `No more than ${options.maxPasswordLength} characters`, met: password.length > 0 && password.length <= options.maxPasswordLength });
  if (options.containsUppercaseLetter) rules.push({ label: "An uppercase letter", met: /[A-Z]/.test(password) });
  if (options.containsLowercaseLetter) rules.push({ label: "A lowercase letter", met: /[a-z]/.test(password) });
  if (options.containsNumericCharacter) rules.push({ label: "A number", met: /[0-9]/.test(password) });
  if (options.containsNonAlphanumericCharacter) rules.push({ label: "A special character", met: [...password].some(c => policy.allowedNonAlphanumericCharacters.includes(c)) });
  return <View style={styles.list}>{rules.map(({ label, met }) => <View key={label} accessible accessibilityLabel={`${label}: ${met ? "met" : "not met"}`} style={styles.rule}>
    {met ? <CircleCheck size={t.size.ruleIcon} color={t.colors.primary} /> : <Circle size={t.size.ruleIcon} color={t.colors.secondary} />}
    <Text style={s.small}>{label}</Text>
  </View>)}</View>;
}
const styles = StyleSheet.create({ list: { gap: t.space.xs }, rule: { flexDirection: "row", gap: t.space.sm, alignItems: "center" } });
