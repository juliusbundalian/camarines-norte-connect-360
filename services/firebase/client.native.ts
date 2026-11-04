import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence, type Auth } from "firebase/auth";
import { initializePersistentAuth } from "./client-core";
export { getFirebaseApp, getFirestoreDb } from "./client-core";
let auth: Auth | undefined;
export function getFirebaseAuth(): Auth {
  return (auth ??= initializePersistentAuth(
    getReactNativePersistence(AsyncStorage),
  ));
}
