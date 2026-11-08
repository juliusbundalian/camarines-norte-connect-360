export const unstable_settings = { anchor: "login" };
import { Redirect, Stack, useLocalSearchParams, usePathname } from "expo-router";
import { AuthFonts } from "../../features/auth/AuthScaffold";
import {useAuth} from '../../features/auth/AuthProvider';
import {getSafeAuthReturnPath} from '../../features/navigation/auth-return';
export default function AuthLayout() {
  const {user}=useAuth();
  const {returnTo}=useLocalSearchParams<{returnTo?:string|string[]}>();
  const pathname=usePathname();
  // Layouts can briefly re-render after their redirect with the destination's params.
  const onAuthRoute=['/login','/register','/forgot-password','/verify-phone'].includes(pathname);
  if(user) return onAuthRoute ? <Redirect href={getSafeAuthReturnPath(returnTo)}/> : null;
  return (
    <AuthFonts>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthFonts>
  );
}
