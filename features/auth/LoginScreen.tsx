import { Button } from "../../components/Button";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HelperText, TextInput } from "react-native-paper";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/Screen";
import { PasswordField } from "../../components/PasswordField";
import { FormError } from "../../components/FormError";
import { useAuth } from "./AuthProvider";
import { useAsyncAction } from "./useAsyncAction";
import { loginSchema, type LoginFields } from "./schemas";
export default function LoginScreen() {
  const { login } = useAuth();
  const action = useAsyncAction();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const submit = handleSubmit(({ email, password }) =>
    action.run(() => login(email, password)),
  );
  return (
    <Screen title="Log in">
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
            />
          )}
        />
        {errors.email && (
          <HelperText type="error">{errors.email.message}</HelperText>
        )}
      </View>
      <View>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <PasswordField
              label="Password"
              autoComplete="current-password"
              textContentType="password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={!!errors.password}
              disabled={action.pending}
              onSubmitEditing={() => void submit()}
            />
          )}
        />
        {errors.password && (
          <HelperText type="error">{errors.password.message}</HelperText>
        )}
      </View>
      <FormError message={action.error} />
      <Button
        mode="contained"
        onPress={() => void submit()}
        loading={action.pending}
        disabled={action.pending}
      >
        Log In
      </Button>
      <Button onPress={() => router.push("/forgot-password")}>
        Forgot Password?
      </Button>
      <Button onPress={() => router.push("/register")}>Register</Button>
    </Screen>
  );
}
