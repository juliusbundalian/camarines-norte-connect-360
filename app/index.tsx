import {useProfile} from "../features/profile/ProfileProvider";
import { Redirect } from "expo-router";
import { useAuth } from "../features/auth/AuthProvider";
import { useOnboarding } from "../features/onboarding/OnboardingProvider";
export default function Index() {
  const { user } = useAuth();
  const { completed } = useOnboarding();
  const profile=useProfile();
  if(user&&profile.phase==='required')return <Redirect href={profile.step==='gender'?'/gender':'/complete-profile'}/>;
  if(user&&(profile.phase==='loading'||profile.phase==='error'))return null;
  return (
    <Redirect href={user ? "/home" : completed ? "/home" : "/onboarding"} />
  );
}
