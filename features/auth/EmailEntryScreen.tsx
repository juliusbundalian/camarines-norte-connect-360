import { useCallback } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { router, useFocusEffect } from "expo-router";
import { checkPasswordPolicy } from "../../services/firebase/password-policy";
import {
  AuthAction,
  AuthAlert,
  AuthScaffold,
  AuthTextLink,
  authStyles as s,
} from "./AuthScaffold";
import { AuthInput } from "./AuthInput";
import { PasswordRequirements } from "./PasswordRequirements";
import { useAuth } from "./AuthProvider";
import { useAsyncAction } from "./useAsyncAction";
import {
  loginSchema,
  registrationSchema,
  type RegistrationFields,
} from "./schemas";
import { authTokens as t } from "../../theme/auth";
import { usePasswordPolicy } from "./usePasswordPolicy";
import { getPasswordRequirements } from "./password-requirements";
import { getErrorCode } from "./errors";

const loginFieldsSchema = loginSchema.extend({ confirmPassword: z.string() });
export default function EmailEntryScreen({
  signup = false,
}: {
  signup?: boolean;
}) {
  const auth = useAuth();
  const action = useAsyncAction();
  const policyState = usePasswordPolicy(signup);
  const {
    control,
    handleSubmit,
    getValues,
    watch,
    formState: { errors, isValid, touchedFields, submitCount },
  } = useForm<RegistrationFields>({
    mode: "all",
    resolver: zodResolver(signup ? registrationSchema : loginFieldsSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });
  const values = watch();
  const schema = signup ? registrationSchema : loginFieldsSchema;
  const policyAllows = (password: string) =>
    !signup ||
    !!(
      !policyState.loading &&
      !policyState.error &&
      policyState.policy &&
      getPasswordRequirements(policyState.policy, password).every(
        (rule) => rule.met,
      )
    );
  // The synchronous schema check closes the gap before RHF's async resolver settles.
  const canSubmit =
    isValid &&
    schema.safeParse(values).success &&
    policyAllows(values.password);
  const fieldError = (name: keyof RegistrationFields) =>
    touchedFields[name] || submitCount > 0 ? errors[name]?.message : undefined;
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        () => action.pending,
      );
      return () => sub.remove();
    }, [action.pending]),
  );
  const submit = handleSubmit(async () => {
    const current = schema.safeParse(getValues());
    if (!current.success || !policyAllows(current.data.password)) return;
    const { email, password } = current.data;
    await action.run(async () => {
      if (signup) {
        const status = await checkPasswordPolicy(password);
        policyState.accept(status.passwordPolicy);
        if (!status.isValid)
          throw { code: "auth/password-does-not-meet-requirements" };
        // Ignore a candidate edited while its authoritative SDK check was in flight.
        const latest = getValues();
        if (
          latest.email.trim() !== email ||
          latest.password !== password ||
          latest.confirmPassword !== password
        )
          return;
        try {
          await auth.register(email, password);
        } catch (error) {
          if (
            [
              "auth/weak-password",
              "auth/password-does-not-meet-requirements",
            ].includes(getErrorCode(error) ?? "")
          )
            policyState.retry();
          throw error;
        }
      } else await auth.login(email, password);
    });
  });
  const back = () => {
    if (action.pending) return;
    if (signup) router.replace("/login");
    else if (router.canGoBack()) router.back();
    else BackHandler.exitApp();
  };
  return (
    <AuthScaffold
      title={signup ? "Create an Account" : "Welcome back"}
      subtitle={
        signup
          ? "Fill up the form below to create an account"
          : "Fill up the form below to login to the app"
      }
      onBack={back}
      busy={action.pending}
    >
      <AuthAlert message={action.error} />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <AuthInput
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            editable={!action.pending}
            error={fieldError("email")}
          />
        )}
      />
      <View style={styles.passwordGroup}>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <AuthInput
              label="Password"
              password
              placeholder="********"
              autoComplete={signup ? "new-password" : "current-password"}
              textContentType={signup ? "newPassword" : "password"}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!action.pending}
              error={fieldError("password")}
              returnKeyType={signup ? "next" : "done"}
              onSubmitEditing={signup ? undefined : () => void submit()}
            />
          )}
        />
        {!signup ? (
          <View style={styles.forgot}>
            <AuthTextLink
              label="Forgot Password?"
              disabled={action.pending}
              onPress={() => router.push("/forgot-password")}
            />
          </View>
        ) : null}
      </View>
      {signup ? (
        <>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <AuthInput
                label="Confirm Password"
                password
                placeholder="********"
                autoComplete="new-password"
                textContentType="newPassword"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                editable={!action.pending}
                error={fieldError("confirmPassword")}
                returnKeyType="done"
                onSubmitEditing={() => void submit()}
              />
            )}
          />
          {policyState.loading ? (
            <Text accessibilityLiveRegion="polite" style={s.small}>
              Loading password requirements...
            </Text>
          ) : null}
          <AuthAlert message={policyState.error} />
          {policyState.error ? (
            <AuthTextLink
              label="Retry password requirements"
              onPress={policyState.retry}
              disabled={action.pending}
            />
          ) : null}
          <PasswordRequirements
            policy={policyState.policy}
            password={values.password}
          />
          <AuthTextLink
            label="Terms & conditions"
            disabled={action.pending}
            onPress={() => router.push("/terms")}
          />
        </>
      ) : null}
      <AuthAction
        label={signup ? "Register" : "Login"}
        busy={action.pending}
        disabled={!canSubmit}
        onPress={() => void submit()}
      />
      <View style={s.row}>
        <Text style={styles.footer}>
          {signup ? "Already have an account? " : "Don’t have an account? "}
        </Text>
        <AuthTextLink
          label={signup ? "Log in" : "Sign up"}
          disabled={action.pending}
          onPress={() =>
            signup ? router.replace("/login") : router.push("/register")
          }
        />
      </View>
    </AuthScaffold>
  );
}
const styles = StyleSheet.create({
  passwordGroup: { gap: t.space.xs },
  forgot: { alignItems: "flex-end" },
  footer: { ...s.label, color: t.colors.secondary },
});
