import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/Screen";
import { FormError } from "../../components/FormError";
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
  return (
    <Screen title={sent ? "Check your email" : "Reset your password"}>
      {sent ? (
        <Text accessibilityLiveRegion="polite">
          If an account exists for this email address, you will receive a
          password reset link.
        </Text>
      ) : (
        <>
          <Text>Enter your email to request a password reset link.</Text>
          <View>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <TextInput
                  mode="outlined"
                  label="Email"
                  accessibilityLabel="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={!!errors.email}
                  disabled={action.pending}
                  onSubmitEditing={() => void submit()}
                />
              )}
            />
            {errors.email && (
              <HelperText type="error">{errors.email.message}</HelperText>
            )}
          </View>
          <FormError message={action.error} />
          <Button
            mode="contained"
            onPress={() => void submit()}
            loading={action.pending}
            disabled={action.pending}
          >
            Send Reset Link
          </Button>
        </>
      )}
      <Button onPress={() => router.replace("/login")}>Back to Login</Button>
    </Screen>
  );
}
