import {getSafeAuthReturnPath} from "../navigation/auth-return";
import { useCallback, useEffect } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import Check from "lucide-react-native/icons/check";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
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

const termsFieldsSchema = z.object({
  termsAccepted: z.boolean().refine((accepted) => accepted, {
    message: "Please agree to the Terms & conditions to register.",
  }),
});
const registrationFieldsSchema = registrationSchema.and(termsFieldsSchema);
const loginFieldsSchema = loginSchema.extend({ confirmPassword: z.string(), termsAccepted: z.boolean() });
type EntryFields = RegistrationFields & { termsAccepted: boolean };
export default function EmailEntryScreen({
  signup = false,
}: {
  signup?: boolean;
}) {
  const params=useLocalSearchParams<{returnTo?:string|string[]}>();
  const returnTo=getSafeAuthReturnPath(params.returnTo);
  const authLink=(pathname:'/login'|'/register'|'/forgot-password')=>({pathname,params:{returnTo}});
  const auth = useAuth();
  const action = useAsyncAction();
  const policyState = usePasswordPolicy(signup);
  const {
    control,
    handleSubmit,
    getValues,
    trigger,
    watch,
    formState: { errors, isValid, submitCount },
  } = useForm<EntryFields>({
    mode: "all",
    resolver: zodResolver(signup ? registrationFieldsSchema : loginFieldsSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", termsAccepted: false },
  });
  const values = watch();
  useEffect(() => {
    if (signup && submitCount > 0) void trigger("confirmPassword");
  }, [signup, values.password, submitCount, trigger]);
  const schema = signup ? registrationFieldsSchema : loginFieldsSchema;
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
  const validationError = submitCount > 0
    ? errors.email?.message ?? errors.password?.message ?? errors.confirmPassword?.message ?? errors.termsAccepted?.message
    : undefined;
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
          latest.confirmPassword !== password ||
          !latest.termsAccepted
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
    if (signup) router.replace(authLink("/login"));
    else if (router.canGoBack()) router.back();
    else router.replace(returnTo);
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
      <AuthAlert message={action.error ?? validationError} />
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
              onPress={() => router.push(authLink("/forgot-password"))}
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
          <View style={styles.termsRow}>
            <Controller
              control={control}
              name="termsAccepted"
              render={({ field }) => (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel="Agree to Terms & conditions"
                  accessibilityState={{ checked: field.value, disabled: action.pending }}
                  onPress={() => field.onChange(!field.value)}
                  disabled={action.pending}
                  hitSlop={11}
                  style={styles.checkbox}
                >
                  <View style={[styles.checkboxBox, field.value && styles.checkboxChecked]}>
                    {field.value ? <Check size={16} strokeWidth={3} color="#FFFFFF" /> : null}
                  </View>
                </Pressable>
              )}
            />
            <Text style={styles.termsCopy}>
              {"By signing up, you agree to our "}
              <Text
                accessibilityRole="button"
                accessibilityLabel="Terms & conditions"
                accessibilityState={{ disabled: action.pending }}
                disabled={action.pending}
                onPress={() => { if (!action.pending) router.push("/terms"); }}
                style={styles.termsLink}
              >
                Terms & conditions
              </Text>
            </Text>
          </View>
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
            signup ? router.replace(authLink("/login")) : router.push(authLink("/register"))
          }
        />
      </View>
    </AuthScaffold>
  );
}
const styles = StyleSheet.create({
  termsRow: { flexDirection: "row", alignItems: "center", gap: t.space.sm },
  checkbox: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
  checkboxBox: { width: 18, height: 18, borderRadius: 3, borderWidth: 2, borderColor: t.colors.secondary, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  termsCopy: { ...s.label, color: t.colors.secondary, flex: 1 },
  termsLink: { color: t.colors.primary },
  passwordGroup: { gap: t.space.xs },
  forgot: { alignItems: "flex-end" },
  footer: { ...s.label, color: t.colors.secondary },
});
