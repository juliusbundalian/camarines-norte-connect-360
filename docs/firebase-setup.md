# Firebase setup

## Android phone authentication

Phone login and signup use the native Firebase Android SDK through React Native Firebase. A successful SMS credential signs in an existing phone account or creates one on first verification. Password policies apply to email/password accounts, not this SMS flow. No custom backend, synthetic email address, profile collection, or custom password reset handler is used.

Requires Node 24.12+, Java 21, Android SDK and a **native development build**. Expo Go does not include these Firebase native modules. `expo-build-properties` pins Kotlin 2.4.20, the latest version supported by the installed Expo compiler artifacts and compatible with Firebase Auth 25.

1. In project `camarines-norte-connect-360`, register an Android app with package **`ph.cn360connect.app`**. The matching registration was added with user approval on 2026-11-06 (app ID `1:1028588633761:android:b26985925f6cca27ed3ae0`). The older `com.camarinesnorteconnect` registration is separate.
2. Download that Android app's `google-services.json` to the repository root, or set `GOOGLE_SERVICES_JSON` to its local path. These files are ignored. Do not use a service-account key. `ANDROID_APP_ID` is only an optional override for isolated QA builds.
3. Register the SHA-1 and SHA-256 fingerprints for the actual signing certificate(s). For local debug builds:

   ```sh
   keytool -list -v -alias androiddebugkey -keystore android/app/debug.keystore -storepass android -keypass android
   ```

   Local development certificate inspected during this task:

   - SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - SHA-256: `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`

   These identify the local Expo debug certificate only. For distributed builds, register the relevant release and Google Play App Signing certificates too. Firebase uses SHA-256 for Play Integrity and SHA-1 for the reCAPTCHA fallback. Re-download the client config after Console changes as needed.
4. Enable Authentication → Phone. SMS region policy is now Allow → Philippines (PH) only, explicitly approved and verified after Console reload during live testing. Review the project's current SMS quota/billing requirements before real SMS testing; billing and SMS region policies are not changed by the app or its tests; the approved Android registration/signing fingerprints are configured in the Console.
5. Put the existing **web client config for the same project** into `.env.local` using `.env.example`. This supports legacy email-session restoration and configuration-only Firestore preparation. Remove `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL` for the live project. Native initialization rejects mismatched project IDs; production builds reject emulator configuration.
6. Run `npx expo prebuild --platform android` and `npm run android`. Rebuild after native configuration changes; Metro reload alone is insufficient.
7. Verify SMS delivery on a physical Android device with a number you control. Verify Play Integrity/reCAPTCHA, incorrect/expired codes, resend/throttling, logout and relaunch. No real SMS was sent during local automated testing.

The app obtains explicit SMS consent before requests and explains Google's spam/abuse processing. The native Terms page is **content pending**: it neither invents legal text nor records acceptance. Publish approved terms in a later approved task.

## Isolated local Android QA (no real SMS)

The checked-in `.firebaserc` targets only `demo-cn360-connect`. Local emulator accounts are disposable and disappear when the server stops. Auth listens at 127.0.0.1:9098; UI4001; hub4402; logging4502. Use `10.0.2.2:9098` from the Android emulator.

Generate a **synthetic demo-only** Android client config, never a production config:

```sh
npm ci
node --test scripts/firebase-android-demo.test.mjs
node scripts/firebase-android-demo.mjs /tmp/cn360-demo-google-services.json
npm run emulators:auth
```

Use a disposable checkout/copy for QA, with its own node_modules (or a local symlink) and **no live .env.local**. Expo 58 development virtual-env can read local env files even when EXPO_NO_DOTENV is set, so shell overrides alone are insufficient. Keep the existing live Metro server/config untouched. In that QA copy, create a demo .env.local and supply the same variables for prebuild, Metro and native build:

```sh
cp .env.example .env.local
# Set its emulator URL to http://10.0.2.2:9098 for Android.
export EXPO_NO_DOTENV=1
export ANDROID_APP_ID=ph.cn360connect.app.phoneqa
export GOOGLE_SERVICES_JSON=/tmp/cn360-demo-google-services.json
export EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDemoOnlyNotARealFirebaseKey123456789
export EXPO_PUBLIC_FIREBASE_PROJECT_ID=demo-cn360-connect
export EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-cn360-connect.firebaseapp.com
export EXPO_PUBLIC_FIREBASE_APP_ID=demo-app
export EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL=http://10.0.2.2:9098
npx expo prebuild --platform android
npx expo run:android --port 8083
# Restart with npx expo start --clear --port 8083 if changing the QA env.
```

Use fictional Philippine-format numbers only. The Auth Emulator's local verification-code endpoint (`/emulator/v1/projects/demo-cn360-connect/verificationCodes`) provides test codes; it never sends SMS. Do not log real numbers/codes or use production credentials against it. Native emulator routing additionally requires a `demo-` project. The emulator does not establish real SMS delivery or Android app verification behavior.

For the existing JavaScript email-auth compatibility integration tests, stop this project's emulator and run `npm run test:emulator`. It starts/stops its own emulator. These tests check the real legacy service, hosted reset actions and JS persistence adapter; Android process-relaunch verification is separate.

Restore normal local environment/config and regenerate Android after QA. Never install an isolated QA APK over the live app or clear the live app's data.

## Sessions, data and deferred platforms

Native Firebase Auth manages phone sessions with its supported Android persistence. The app never manually stores phone credentials, SMS codes or confirmation handles. Pending verification exists only in memory; a cold OTP deep link returns to phone entry. Legacy Firebase JavaScript email sessions retain the supported React Native AsyncStorage adapter until logout; AsyncStorage is not encrypted keychain storage. The native observer takes precedence, startup waits for both stores, and logout attempts both.

Existing email accounts are not deleted, migrated, or automatically linked to phone accounts. Their restored sessions remain valid. After logout the new public UI is phone-only; linking or migrating existing email accounts requires a separately approved flow. Legacy email reset/service code remains available internally and through its existing route.

Firestore is still lazy configuration only. Native Auth and JavaScript Auth are distinct sessions: future Firestore/Storage features must use a compatible authenticated SDK or an explicitly planned bridge. Do not assume a native phone session authenticates the existing JavaScript Firestore instance. No collections, rules or Storage integration are created here.

Android is primary. iOS native Firebase registration/APNs/reCAPTCHA configuration and testing remain deferred. Web phone verification is explicitly unsupported; the web fallback reports that a native Android app is required.

Never commit Admin SDK keys, passwords, or service-account files. `EXPO_PUBLIC_*` values and Firebase client JSON are public client identifiers, not server secrets. Keep local env/client files ignored and ensure proper Firebase rules when later data features are approved.

## References

- [React Native Firebase phone authentication](https://rnfirebase.io/auth/phone-auth)
- [Firebase Android phone setup and app verification](https://firebase.google.com/docs/auth/android/phone-auth)
- [Auth Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth)
- [Expo native Firebase setup](https://docs.expo.dev/guides/using-firebase/)
- [Expo build properties](https://docs.expo.dev/versions/latest/sdk/build-properties/)
