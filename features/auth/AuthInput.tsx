import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import Eye from "lucide-react-native/icons/eye";
import EyeOff from "lucide-react-native/icons/eye-off";
import { authStyles as s } from "./AuthScaffold";
import { authTokens as t } from "../../theme/auth";

export function AuthInput({ label, error, password = false, ...props }: TextInputProps & { label: string; error?: string; password?: boolean }) {
  const [visible, setVisible] = useState(false);
  const visibilityName = label === "Confirm Password" ? "confirm password" : "password";
  return (
    <View style={styles.group}>
      <Text style={s.label}>{label}</Text>
      <View style={[styles.container, error ? s.fieldError : undefined]}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          accessibilityHint={error}
          secureTextEntry={password && !visible}
          placeholderTextColor={t.colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        {password ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`${visible ? "Hide" : "Show"} ${visibilityName}`} disabled={props.editable === false} onPress={() => setVisible(!visible)} style={styles.eye}>
            {visible ? <EyeOff size={t.size.icon} color={t.colors.secondary} /> : <Eye size={t.size.icon} color={t.colors.secondary} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: t.space.xxs },
  container: { minHeight: t.size.input, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius.field, flexDirection: "row", alignItems: "center" },
  input: { ...s.body, color: t.colors.text, flex: 1, minWidth: 0, minHeight: t.size.input - 2, paddingHorizontal: t.space.md, paddingVertical: t.space.sm },
  eye: { minWidth: t.size.action, minHeight: t.size.action, justifyContent: "center", alignItems: "center" },
});
