export const unstable_settings = { anchor: "login" };
import { Stack } from "expo-router";
import { PhoneVerificationProvider } from "../../features/auth/PhoneVerificationProvider";
import { AuthFonts } from "../../features/auth/AuthScaffold";
export default function AuthLayout() {
  return (
    <AuthFonts>
      <PhoneVerificationProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </PhoneVerificationProvider>
    </AuthFonts>
  );
}
