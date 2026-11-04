import "firebase/auth";
import type { Persistence } from "firebase/auth";
import type AsyncStorage from "@react-native-async-storage/async-storage";
// Firebase exports this at runtime under the react-native condition, but its
// shared declaration entry omits it. Keep this bridge limited to the public API.
declare module "firebase/auth" {
  export function getReactNativePersistence(
    storage: Pick<typeof AsyncStorage, "getItem" | "setItem" | "removeItem">,
  ): Persistence;
}
