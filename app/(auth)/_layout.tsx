export const unstable_settings = { anchor: "login" };
import { Stack } from "expo-router";
import { AuthFonts } from "../../features/auth/AuthScaffold";
export default function AuthLayout() {
  return (
    <AuthFonts>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthFonts>
  );
}
