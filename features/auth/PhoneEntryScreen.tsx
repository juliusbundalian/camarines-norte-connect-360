import { useCallback } from "react";
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Square from "lucide-react-native/icons/square";
import SquareCheck from "lucide-react-native/icons/square-check";
import { router, useFocusEffect } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { phoneSchema } from "./phone-schemas";
import {
  usePhoneVerification,
  type PhoneIntent,
} from "./PhoneVerificationProvider";
import {
  AuthAction,
  AuthAlert,
  AuthLink,
  AuthScaffold,
  authStyles as s,
} from "./AuthScaffold";
import { authTokens as t } from "../../theme/auth";
const schema = z.object({
  phone: phoneSchema,
  consent: z
    .boolean()
    .refine(Boolean, "Please allow us to send your verification SMS."),
});
export default function PhoneEntryScreen({ intent }: { intent: PhoneIntent }) {
  const verification = usePhoneVerification();
  const signup = intent === "register";
  const busy = verification.sending || verification.verifying;
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", consent: false },
  });
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => busy);
      return () => sub.remove();
    }, [busy]),
  );
  const submit = handleSubmit(async ({ phone }) => {
    if (await verification.start(phone, intent)) router.push("/verify-phone");
  });
  const back = () => {
    if (busy) return;
    if (signup) router.replace("/login");
    else if (router.canGoBack()) router.back();
    else BackHandler.exitApp();
  };
  return (
    <AuthScaffold
      title={signup ? "Create an Account" : "Welcome back"}
      subtitle={
        signup
          ? "Sign up and get connected to the app"
          : "Log in to stay connected to the app"
      }
      busy={busy}
      onBack={back}
    >
      <AuthAlert message={verification.error} />
      <View style={s.gap}>
        <Text style={s.label}>Mobile number</Text>
        <View style={[styles.phone, errors.phone && s.fieldError]}>
          <Text style={styles.prefix}>+63</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <TextInput
                accessibilityLabel="Mobile number"
                accessibilityHint="Philippine mobile number, for example 9171234567"
                keyboardType="phone-pad"
                autoComplete="tel-national"
                textContentType="telephoneNumber"
                placeholder="917 123 4567"
                placeholderTextColor={t.colors.muted}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                editable={!busy}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={() => void submit()}
              />
            )}
          />
        </View>
        {errors.phone ? (
          <Text accessibilityLiveRegion="polite" style={s.error}>
            {errors.phone.message}
          </Text>
        ) : null}
      </View>
      <Text style={s.body}>
        We’ll send a 6-digit SMS code to verify your number. No password is
        needed.
      </Text>
      <View>
        <Controller
          control={control}
          name="consent"
          render={({ field }) => (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel="Send me an SMS verification code"
              accessibilityState={{ checked: field.value, disabled: busy }}
              disabled={busy}
              onPress={() => field.onChange(!field.value)}
              style={styles.checkbox}
            >
              {field.value ? (
                <SquareCheck color={t.colors.primary} size={t.size.icon} />
              ) : (
                <Square color={t.colors.secondary} size={t.size.icon} />
              )}
              <Text style={styles.consent}>
                Send me an SMS verification code
              </Text>
            </Pressable>
          )}
        />
        {errors.consent ? (
          <Text accessibilityLiveRegion="polite" style={s.error}>
            {errors.consent.message}
          </Text>
        ) : null}
      </View>
      <Text style={s.small}>
        Your phone number will be sent to and stored by Google to improve spam
        and abuse prevention across Google services. SMS charges may apply.
      </Text>
      {signup ? (
        <AuthLink
          label="Terms & conditions"
          disabled={busy}
          onPress={() => router.push("/terms")}
        />
      ) : null}
      <AuthAction label="Send code" busy={busy} onPress={() => void submit()} />
      <View style={s.row}>
        <Text style={s.body}>
          {signup ? "Already have an account?" : "Don’t have an account?"}
        </Text>
        <AuthLink
          label={signup ? "Log in" : "Sign up"}
          disabled={busy}
          onPress={() =>
            signup ? router.replace("/login") : router.push("/register")
          }
        />
      </View>
    </AuthScaffold>
  );
}
const styles = StyleSheet.create({
  phone: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: t.radius.field,
    minHeight: t.size.input,
  },
  prefix: {
    ...t.type.body,
    fontFamily: t.fonts.regular,
    color: t.colors.text,
    width: t.size.prefix,
    textAlign: "center",
  },
  input: {
    flex: 1,
    minWidth: 0,
    ...t.type.body,
    fontFamily: t.fonts.regular,
    color: t.colors.text,
    paddingVertical: t.space.md,
    paddingRight: t.space.md,
  },
  consent: {
    ...t.type.label,
    fontFamily: t.fonts.regular,
    color: t.colors.text,
    textAlign: "left",
    flex: 1,
  },
  checkbox: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: t.size.action,
    flexDirection: "row",
    alignItems: "center",
    gap: t.space.sm,
  },
});
