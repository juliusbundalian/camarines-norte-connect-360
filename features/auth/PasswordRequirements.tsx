import type { PasswordPolicy } from "firebase/auth";
import { StyleSheet, Text, View } from "react-native";
import Circle from "lucide-react-native/icons/circle";
import CircleCheck from "lucide-react-native/icons/circle-check";
import { authTokens as t } from "../../theme/auth";
import { authStyles as s } from "./AuthScaffold";
import { getPasswordRequirements } from "./password-requirements";

export function PasswordRequirements({
  policy,
  password,
}: {
  policy: PasswordPolicy | null;
  password: string;
}) {
  if (!policy) return null;
  const rules = getPasswordRequirements(policy, password).filter(
    ({ key }) => key !== "maxLength",
  );
  return (
    <View style={styles.list}>
      <Text style={s.body}>Password Requirements:</Text>
      {rules.map(({ key, label, met }) => (
        <View
          key={key}
          accessible
          accessibilityLabel={`${label}: ${met ? "met" : "not met"}`}
          style={styles.rule}
        >
          {met ? (
            <CircleCheck size={t.size.ruleIcon} color={t.colors.primary} />
          ) : (
            <Circle size={t.size.ruleIcon} color={t.colors.secondary} />
          )}
          <Text style={s.small}>{label}</Text>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  list: { gap: t.space.xs },
  rule: { flexDirection: "row", gap: t.space.sm, alignItems: "center" },
});
