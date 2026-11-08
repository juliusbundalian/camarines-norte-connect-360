export const unstable_settings = { anchor: "login" };
import {useState} from "react";
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
  if(user) return onAuthRoute ? <AuthenticatedReturn returnTo={returnTo}/> : null;
  return (
    <AuthFonts>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthFonts>
  );
}

function AuthenticatedReturn({returnTo}:{returnTo:string|string[]|undefined}) {
  // Freeze this redirect's validated target while the router replaces auth params.
  const [destination]=useState(() => getSafeAuthReturnPath(returnTo));
  return <Redirect href={destination}/>;
}
