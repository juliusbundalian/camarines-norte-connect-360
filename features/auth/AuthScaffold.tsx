import { useState, type PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Button, IconButton } from "react-native-paper";
import ArrowLeft from "lucide-react-native/icons/arrow-left";
import TriangleAlert from "lucide-react-native/icons/triangle-exclamation-point";
import { useFonts } from "expo-font";
import { StartupError } from "../../components/StartupError";
import { authTokens as t } from "../../theme/auth";
export function AuthFonts({ children }: PropsWithChildren) {
  const [attempt, setAttempt] = useState(0);
  return (
    <FontAttempt key={attempt} retry={() => setAttempt((n) => n + 1)}>
      {children}
    </FontAttempt>
  );
}
function FontAttempt({
  children,
  retry,
}: PropsWithChildren<{ retry(): void }>) {
  const [loaded, error] = useFonts({
    "PublicSans-Regular": require("../../assets/fonts/PublicSans-Regular.ttf"),
    "PublicSans-Medium": require("../../assets/fonts/PublicSans-Medium.ttf"),
  });
  if (error)
    return (
      <StartupError
        message="Could not load authentication fonts. Please retry."
        retry={retry}
      />
    );
  if (!loaded)
    return (
      <View style={s.loading}>
        <ActivityIndicator accessibilityLabel="Loading authentication fonts" />
      </View>
    );
  return children;
}
export function AuthScaffold({
  title,
  subtitle,
  onBack,
  busy = false,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  onBack(): void;
  busy?: boolean;
}>) {
  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.scroll}
        >
          <View style={s.bar}>
            <IconButton
              icon={({ size, color }) => (
                <ArrowLeft size={size} color={color} />
              )}
              iconColor={t.colors.text}
              size={t.size.icon}
              accessibilityLabel="Back"
              disabled={busy}
              onPress={onBack}
              style={s.back}
            />
          </View>
          <View style={s.content}>
            <View style={s.headingGroup}>
              <Text accessibilityRole="header" style={s.heading}>
                {title}
              </Text>
              {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function AuthAlert({ message }: { message: string | null | undefined }) {
  return message ? (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={s.alert}
    >
      <TriangleAlert color={t.colors.error} size={t.size.icon} />
      <Text style={s.alertText}>{message}</Text>
    </View>
  ) : null;
}
export function AuthAction({
  label,
  onPress,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress(): void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      mode="contained"
      testID="auth-primary-action"
      buttonColor={t.colors.action}
      textColor={t.colors.text}
      loading={busy}
      disabled={busy || disabled}
      onPress={onPress}
      style={[s.action, (busy || disabled) && s.actionDisabled]}
      contentStyle={s.actionContent}
      labelStyle={s.actionLabel}
    >
      {label}
    </Button>
  );
}
export function AuthLink({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress(): void;
  disabled?: boolean;
}) {
  return (
    <Button
      mode="text"
      textColor={t.colors.primary}
      disabled={disabled}
      onPress={onPress}
      labelStyle={s.linkLabel}
      contentStyle={s.actionContent}
    >
      {label}
    </Button>
  );
}
export function AuthTextLink({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress(): void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={t.space.sm}
      onPress={onPress}
    >
      <Text style={[s.textLink, disabled && s.disabledLink]}>{label}</Text>
    </Pressable>
  );
}
export const authStyles = StyleSheet.create({
  label: { ...t.type.label, fontFamily: t.fonts.medium, color: t.colors.text },
  body: {
    ...t.type.body,
    fontFamily: t.fonts.regular,
    color: t.colors.secondary,
  },
  small: {
    ...t.type.small,
    fontFamily: t.fonts.regular,
    color: t.colors.secondary,
  },
  field: {
    minHeight: t.size.input,
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: t.radius.field,
    paddingHorizontal: t.space.md,
    color: t.colors.text,
    fontFamily: t.fonts.regular,
    ...t.type.body,
  },
  fieldError: { borderColor: t.colors.error },
  gap: { gap: t.space.sm },
  error: {
    ...t.type.small,
    fontFamily: t.fonts.regular,
    color: t.colors.error,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
});
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.colors.background },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.background,
  },
  scroll: { flexGrow: 1 },
  bar: {
    minHeight: t.size.appBar,
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.sm,
    justifyContent: "center",
  },
  back: {
    margin: 0,
    width: t.size.action,
    height: t.size.action,
    borderRadius: t.radius.button,
    backgroundColor: t.colors.subtle,
  },
  content: { padding: t.space.md, gap: t.space.md },
  headingGroup: { gap: t.space.xs },
  textLink: {
    ...t.type.label,
    fontFamily: t.fonts.medium,
    color: t.colors.primary,
  },
  disabledLink: { color: t.colors.muted },
  heading: {
    ...t.type.heading,
    fontFamily: t.fonts.regular,
    color: t.colors.text,
    textAlign: "center",
  },
  subtitle: {
    ...t.type.body,
    fontFamily: t.fonts.regular,
    color: t.colors.secondary,
    textAlign: "center",
  },
  alert: {
    padding: t.space.md,
    gap: t.space.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: t.radius.field,
    backgroundColor: t.colors.errorBackground,
  },
  alertText: {
    flex: 1,
    ...t.type.body,
    fontFamily: t.fonts.regular,
    color: t.colors.error,
  },
  action: {
    borderRadius: t.radius.button,
    backgroundColor: t.colors.action,
    opacity: 1,
  },
  actionDisabled: { opacity: t.opacity.disabled },
  actionContent: { minHeight: t.size.action },
  actionLabel: {
    ...t.type.body,
    fontFamily: t.fonts.medium,
    color: t.colors.text,
  },
  linkLabel: { ...t.type.label, fontFamily: t.fonts.medium },
});
