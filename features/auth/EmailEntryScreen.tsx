import { useCallback, useEffect, useState } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { router, useFocusEffect } from "expo-router";
import type { PasswordPolicy } from "firebase/auth";
import { checkPasswordPolicy } from "../../services/firebase/password-policy";
import { AuthAction, AuthAlert, AuthScaffold, AuthTextLink, authStyles as s } from "./AuthScaffold";
import { AuthInput } from "./AuthInput";
import { PasswordRequirements } from "./PasswordRequirements";
import { useAuth } from "./AuthProvider";
import { useAsyncAction } from "./useAsyncAction";
import { loginSchema, registrationSchema, type RegistrationFields } from "./schemas";
import { authTokens as t } from "../../theme/auth";

const loginFieldsSchema = loginSchema.extend({ confirmPassword: z.string() });
export default function EmailEntryScreen({ signup = false }: { signup?: boolean }) {
  const auth = useAuth();
  const action = useAsyncAction();
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const { control, handleSubmit, watch, formState: { errors } } = useForm<RegistrationFields>({
    resolver: zodResolver(signup ? registrationSchema : loginFieldsSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });
  useEffect(() => {
    if (!signup) return;
    let active = true;
    void checkPasswordPolicy("").then(result => { if (active) setPolicy(result.passwordPolicy); }).catch(() => {});
    return () => { active = false; };
  }, [signup]);
  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => action.pending);
    return () => sub.remove();
  }, [action.pending]));
  const submit = handleSubmit(async ({ email, password }) => {
    await action.run(async () => {
      if (signup) {
        const status = await checkPasswordPolicy(password);
        setPolicy(status.passwordPolicy);
        if (!status.isValid) throw { code: "auth/password-does-not-meet-requirements" };
        await auth.register(email, password);
      } else await auth.login(email, password);
    });
  });
  const back = () => {
    if (action.pending) return;
    if (signup) router.replace("/login");
    else if (router.canGoBack()) router.back();
    else BackHandler.exitApp();
  };
  return <AuthScaffold title={signup ? "Create an Account" : "Welcome back"} subtitle={signup ? "Fill up the form below to create an account" : "Fill up the form below to login to the app"} onBack={back} busy={action.pending}>
    <AuthAlert message={action.error} />
    <Controller control={control} name="email" render={({ field }) => <AuthInput label="Email" placeholder="you@example.com" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} editable={!action.pending} error={errors.email?.message} />} />
    <View style={styles.passwordGroup}>
      <Controller control={control} name="password" render={({ field }) => <AuthInput label="Password" password placeholder="********" autoComplete={signup ? "new-password" : "current-password"} textContentType={signup ? "newPassword" : "password"} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} editable={!action.pending} error={errors.password?.message} returnKeyType={signup ? "next" : "done"} onSubmitEditing={signup ? undefined : () => void submit()} />} />
      {!signup ? <View style={styles.forgot}><AuthTextLink label="Forgot Password?" disabled={action.pending} onPress={() => router.push("/forgot-password")} /></View> : null}
    </View>
    {signup ? <>
      <Controller control={control} name="confirmPassword" render={({ field }) => <AuthInput label="Confirm Password" password placeholder="********" autoComplete="new-password" textContentType="newPassword" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} editable={!action.pending} error={errors.confirmPassword?.message} returnKeyType="done" onSubmitEditing={() => void submit()} />} />
      <PasswordRequirements policy={policy} password={watch("password")} />
      <AuthTextLink label="Terms & conditions" disabled={action.pending} onPress={() => router.push("/terms")} />
    </> : null}
    <AuthAction label={signup ? "Register" : "Login"} busy={action.pending} onPress={() => void submit()} />
    <View style={s.row}><Text style={styles.footer}>{signup ? "Already have an account? " : "Don’t have an account? "}</Text><AuthTextLink label={signup ? "Log in" : "Sign up"} disabled={action.pending} onPress={() => signup ? router.replace("/login") : router.push("/register")} /></View>
  </AuthScaffold>;
}
const styles = StyleSheet.create({ passwordGroup: { gap: t.space.xs }, forgot: { alignItems: "flex-end" }, footer: { ...s.label, color: t.colors.secondary } });
