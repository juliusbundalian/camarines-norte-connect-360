export const unstable_settings = { initialRouteName: 'index' };
import {useEffect} from 'react';
import {StyleSheet,View} from 'react-native';
import {Stack} from 'expo-router';
import {PaperProvider,ActivityIndicator} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {AuthProvider,useAuth} from '../features/auth/AuthProvider';
import {OnboardingProvider,useOnboarding} from '../features/onboarding/OnboardingProvider';
import {StartupError} from '../components/StartupError';
import {theme,tokens} from '../theme';
void SplashScreen.preventAutoHideAsync().catch(()=>{});
function Navigation() {
  const auth=useAuth();const onboarding=useOnboarding();const ready=auth.ready&&onboarding.ready;
  const error=auth.error || (!auth.user?onboarding.initializationError:null);
  useEffect(()=>{if(ready)void SplashScreen.hideAsync().catch(()=>{});},[ready]);
  // During retry the native splash has already gone; show a neutral loader.
  if(!ready)return <View style={styles.loading}><ActivityIndicator accessibilityLabel="Restoring application state"/></View>;
  if(error)return <StartupError message={error} retry={()=>{auth.retry();onboarding.retry();}}/>;
  return <Stack screenOptions={{headerShown:false}}>
    <Stack.Screen name="index"/>
    <Stack.Protected guard={!!auth.user}><Stack.Screen name="(app)"/></Stack.Protected>
    <Stack.Protected guard={!auth.user&&!onboarding.completed}><Stack.Screen name="onboarding"/></Stack.Protected>
    <Stack.Protected guard={!auth.user&&onboarding.completed}><Stack.Screen name="(auth)"/></Stack.Protected>
  </Stack>;
}
export default function RootLayout() {
  return <SafeAreaProvider><PaperProvider theme={theme}><AuthProvider><OnboardingProvider><StatusBar style="dark"/><Navigation/></OnboardingProvider></AuthProvider></PaperProvider></SafeAreaProvider>;
}
const styles=StyleSheet.create({loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:tokens.colors.background}});
