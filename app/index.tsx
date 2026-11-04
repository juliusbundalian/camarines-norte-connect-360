import {Redirect} from 'expo-router';
import {useAuth} from '../features/auth/AuthProvider';
import {useOnboarding} from '../features/onboarding/OnboardingProvider';
export default function Index() {
  const {user}=useAuth();const {completed}=useOnboarding();
  return <Redirect href={user?'/welcome':completed?'/login':'/onboarding'}/>;
}
