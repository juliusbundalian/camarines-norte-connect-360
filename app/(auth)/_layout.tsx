import {stackOptions} from '../../features/navigation/stack-options';
export const unstable_settings = { anchor: "login" };
import {MainFonts} from "../../features/navigation/MainFonts";
import {useProfile} from "../../features/profile/ProfileProvider";
import {useState} from "react";
import { Redirect, Stack, useLocalSearchParams, usePathname } from "expo-router";
import { AuthFonts } from "../../features/auth/AuthScaffold";
import {useAuth} from '../../features/auth/AuthProvider';
import {getSafeAuthReturnPath} from '../../features/navigation/auth-return';
export default function AuthLayout() {
  const auth=useAuth();
  const {user}=auth;
  const profile=useProfile();
  const {returnTo}=useLocalSearchParams<{returnTo?:string|string[]}>();
  const pathname=usePathname();
  const [returnDestination]=useState(()=>getSafeAuthReturnPath(returnTo));
  // Layouts can briefly re-render after their redirect with the destination's params.
  const onAuthRoute=['/login','/register','/forgot-password','/verify-phone'].includes(pathname);
  const presenting=auth.registrationPhase!=="idle" && pathname==='/register';
  if(user&&!presenting) {
    if(profile.phase==='required')return <Redirect href={profile.step==='gender'?'/gender':'/complete-profile'}/>;
    if(profile.phase==='loading'||profile.phase==='error')return null;
    return onAuthRoute ? <AuthenticatedReturn returnTo={returnDestination}/> : null;
  }
  return (
    <MainFonts><AuthFonts>
      <Stack screenOptions={stackOptions} />
    </AuthFonts></MainFonts>
  );
}

function AuthenticatedReturn({returnTo}:{returnTo:string|string[]|undefined}) {
  // Freeze this redirect's validated target while the router replaces auth params.
  const [destination]=useState(() => getSafeAuthReturnPath(returnTo));
  return <Redirect href={destination}/>;
}
