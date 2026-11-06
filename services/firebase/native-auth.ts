import { getAuth, connectAuthEmulator } from "@react-native-firebase/auth";
import { getFirebaseConfiguration } from "./config";
let auth: ReturnType<typeof getAuth> | undefined;
export function getNativeAuth() {
  if (auth) return auth;
  const config = getFirebaseConfiguration();
  const native = getAuth();
  if (native.app.options.projectId !== config.options.projectId)
    throw new Error(
      "Firebase Android configuration does not match EXPO_PUBLIC_FIREBASE_PROJECT_ID.",
    );
  if (config.emulatorUrl) {
    if (!config.options.projectId?.startsWith("demo-"))
      throw new Error("Native Auth Emulator requires a demo- project.");
    connectAuthEmulator(native, config.emulatorUrl);
  }
  auth = native;
  return native;
}
