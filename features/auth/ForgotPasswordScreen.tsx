import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Text } from "react-native";
import { router } from "expo-router";
import {
  AuthAction,
  AuthAlert,
  AuthScaffold,
  AuthTextLink,
  authStyles,
} from "./AuthScaffold";
import { AuthInput } from "./AuthInput";
import { useAuth } from "./AuthProvider";
import { useAsyncAction } from "./useAsyncAction";
import { resetPasswordSchema, type ResetPasswordFields } from "./schemas";
export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const action = useAsyncAction();
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });
  const submit = handleSubmit(async ({ email }) => {
    if (await action.run(() => requestPasswordReset(email))) setSent(true);
  });
  const back = () => {
    if (!action.pending) router.replace("/login");
  };
  return (
    <AuthScaffold
      title={sent ? "Check your email" : "Reset your password"}
      subtitle={
        sent ? undefined : "Enter your email to request a password reset link."
      }
      onBack={back}
      busy={action.pending}
    >
      {sent ? (
        <Text accessibilityLiveRegion="polite" style={authStyles.body}>
          If an account exists for this email address, you will receive a
          password reset link.
        </Text>
      ) : (
        <>
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
                error={errors.email?.message}
                returnKeyType="done"
                onSubmitEditing={() => void submit()}
              />
            )}
          />
          <AuthAction
            label="Send Reset Link"
            onPress={() => void submit()}
            busy={action.pending}
          />
        </>
      )}
      <AuthTextLink
        label="Back to Login"
        disabled={action.pending}
        onPress={back}
      />
    </AuthScaffold>
  );
}
