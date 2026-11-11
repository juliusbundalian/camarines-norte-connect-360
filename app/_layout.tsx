import {stackOptions} from '../features/navigation/stack-options';
export const unstable_settings = { anchor: "index" };
import {ProfileProvider,useProfile} from "../features/profile/ProfileProvider";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { PaperProvider, ActivityIndicator,Button,Text } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import {
  OnboardingProvider,
  useOnboarding,
} from "../features/onboarding/OnboardingProvider";
import { StartupError } from "../components/StartupError";
import { theme, tokens } from "../theme";
void SplashScreen.preventAutoHideAsync().catch(() => {});
function Navigation() {
  const auth = useAuth();
  const onboarding = useOnboarding();
  const profile=useProfile();
  const presenting=auth.registrationPhase!=="idle";
  const profileLoading=!!auth.user&&profile.phase==='loading'&&!presenting;
  const profileError=!!auth.user&&profile.phase==='error'&&!presenting;
  const ready = auth.ready && onboarding.ready;
  const error =
    auth.error || (!auth.user ? onboarding.initializationError : null);
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  // During retry the native splash has already gone; show a neutral loader.
  if (!ready)
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          accessibilityLabel="Restoring application state"
        />
      </View>
    );
  if (error && !auth.logoutPending && !auth.logoutError)
    return (
      <StartupError
        message={error}
        retry={() => {
          auth.retry();
          onboarding.retry();
        }}
      />
    );
  const setupRequired=!!auth.user&&profile.phase==='required'&&!presenting;
  const mainAllowed=(!auth.user&&onboarding.completed)||(!!auth.user&&!setupRequired&&!presenting);
  const signingOut = auth.logoutPending || !!auth.logoutError || profileLoading || profileError;
  return (
    <View style={styles.container}>
    <View style={styles.container} accessibilityElementsHidden={signingOut} importantForAccessibility={signingOut ? "no-hide-descendants" : "auto"}>
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={mainAllowed}>
        <Stack.Screen name="(main)" />
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!!auth.user || onboarding.completed}><Stack.Screen name="terms" /></Stack.Protected>
      <Stack.Protected guard={setupRequired}><Stack.Screen name="(profile)" /></Stack.Protected>
      <Stack.Protected guard={!auth.user && !onboarding.completed}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!setupRequired && (!!auth.user || onboarding.completed)}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
    </View>
    {auth.logoutPending ? <View style={[StyleSheet.absoluteFill, styles.loading]}><ActivityIndicator accessibilityLabel="Signing out" /></View> : auth.logoutError ? (
      <View style={StyleSheet.absoluteFill}>
        <StartupError title="Sign-out incomplete" message={auth.logoutError} retry={() => { void auth.logout().catch(() => {}); }} />
      </View>
    ) : profileLoading ? <View style={[StyleSheet.absoluteFill,styles.loading]}><ActivityIndicator accessibilityLabel="Restoring profile setup"/></View> : profileError ? <View style={[StyleSheet.absoluteFill,styles.loading]}><Text accessibilityRole="header">Unable to load profile setup</Text><Text accessibilityRole="alert">{profile.error}</Text><Button onPress={profile.retry}>Retry</Button><Button onPress={()=>{void auth.logout().catch(()=>{});}}>Sign out</Button></View> : null}
    </View>
  );
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <ProfileProvider>
          <OnboardingProvider>
            <StatusBar style="dark" />
            <Navigation />
          </OnboardingProvider>
          </ProfileProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.background },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colors.background,
  },
});
