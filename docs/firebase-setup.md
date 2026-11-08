# Firebase setup

## Current email/password authentication (2026-11-08)

The public Login/Register screens use email and password with the existing Firebase JavaScript SDK. In Firebase Console → Authentication → Sign-in method, enable **Email/Password** (email-link sign-in is not needed). Keep the existing web-client values in `.env.local`; Email/Password does not require a Blaze upgrade or verification SMS. Do not change billing for this flow.

Registration checks the project password policy through Firebase `validatePassword` and then calls `createUserWithEmailAndPassword`; Login uses `signInWithEmailAndPassword`. The app minimum is 8 characters for new accounts, while existing users may sign in with older passwords. Policy indicators reflect Firebase's configured requirements; the server remains authoritative. The app does not call `sendEmailVerification` or require `emailVerified`. New accounts proceed directly to the authenticated placeholder.

Register stays disabled until Firebase password requirements load and the inputs satisfy them. If requirements cannot load, use **Retry password requirements**; no default policy bypass is used. Login and password-reset validity do not depend on this registration lookup.

Forgot Password uses `sendPasswordResetEmail`, account-neutral confirmation, and Firebase's default hosted reset action. Password-reset email remains part of account recovery; it is separate from email verification. No custom reset-link handler or account/profile records are created.

Firebase's supported React Native AsyncStorage persistence restores email sessions; the app never manually stores passwords. Existing native phone sessions are retained until logout, and logout still attempts both stores. Public phone entry, SMS consent and code screens are removed; old `/verify-phone` links return to Login. Existing phone-only accounts are not automatically converted or linked to email accounts. After logout, those users need an email account; migration/linking needs a separately approved flow. Existing Firebase providers/accounts remain unchanged in the Console.

Native builds still include the existing React Native Firebase compatibility adapter and require the matching local Android client JSON, as documented below. Do not remove native modules or credentials from an installed app without planning session compatibility. Android is primary; iOS testing remains deferred.

## Historical Android phone authentication (public flow retired)

The previous phone login and signup used the native Firebase Android SDK through React Native Firebase. A successful SMS credential signs in an existing phone account or creates one on first verification. Password policies apply to email/password accounts, not this SMS flow. No custom backend, synthetic email address, profile collection, or custom password reset handler is used.

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
4. Enable Authentication → Phone. SMS region policy is now Allow → Philippines (PH) only, explicitly approved and verified after Console reload during live testing. Real verification SMS requires a linked Cloud Billing account / Blaze plan ([Firebase requirements](https://firebase.google.com/docs/auth/faq-and-troubleshooting), [limits](https://firebase.google.com/docs/auth/limits)); a displayed daily quota does not establish billing eligibility. The latest live request was rejected with `BILLING_NOT_ENABLED`. Billing remains unchanged and must be configured by the project owner before another real-SMS test. The approved Android registration/signing fingerprints are configured in the Console.
5. Put the existing **web client config for the same project** into `.env.local` using `.env.example`. This supports legacy email-session restoration and configuration-only Firestore preparation. Remove `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL` for the live project. Native initialization rejects mismatched project IDs; production builds reject emulator configuration.
6. Run `npx expo prebuild --platform android` and `npm run android`. Rebuild after native configuration changes; Metro reload alone is insufficient.
7. Verify SMS delivery on a physical Android device with a number you control. Verify Play Integrity/reCAPTCHA, incorrect/expired codes, resend/throttling, logout and relaunch. No real SMS was sent during local automated testing.

The app obtains explicit SMS consent before requests and explains Google's spam/abuse processing. The native Terms page is **content pending**: it neither invents legal text nor records acceptance. Publish approved terms in a later approved task.

If the Android emulator connects to `AndroidWifi` but cannot resolve internet hosts, restart it with explicit DNS, without wiping its data:

```sh
$ANDROID_HOME/emulator/emulator -avd Diorama_API_35 -no-snapshot-save -dns-server 8.8.8.8,8.8.4.4
```

Close the running instance of that AVD first. This follows the [Android Emulator DNS workaround](https://developer.android.com/studio/run/emulator-troubleshooting). Verify connectivity before requesting another SMS; the code is delivered to the real mobile number, not the emulator.

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

Native Firebase Auth preserves pre-existing phone sessions with its supported Android persistence. The app never manually stores phone credentials, SMS codes or confirmation handles. Pending verification exists only in memory; a cold OTP deep link returns to phone entry. Legacy Firebase JavaScript email sessions retain the supported React Native AsyncStorage adapter until logout; AsyncStorage is not encrypted keychain storage. The native observer takes precedence, startup waits for both stores, and logout attempts both.

Existing email accounts are not deleted, migrated, or automatically linked to phone accounts. Their restored sessions remain valid. The historical phone-only UI has been replaced again by email/password; linking or migrating phone-only accounts requires a separately approved flow. Legacy email reset/service code remains available internally and through its existing route.

Firestore is still lazy configuration only. Native Auth and JavaScript Auth are distinct sessions: future Firestore/Storage features must use a compatible authenticated SDK or an explicitly planned bridge. Do not assume a native phone session authenticates the existing JavaScript Firestore instance. No collections, rules or Storage integration are created here.

Android is primary. iOS native Firebase registration/APNs/reCAPTCHA configuration and testing remain deferred. Web phone verification is explicitly unsupported; the web fallback reports that a native Android app is required.

Never commit Admin SDK keys, passwords, or service-account files. `EXPO_PUBLIC_*` values and Firebase client JSON are public client identifiers, not server secrets. Keep local env/client files ignored and ensure proper Firebase rules when later data features are approved.

## References

- [React Native Firebase phone authentication](https://rnfirebase.io/auth/phone-auth)
- [Firebase Android phone setup and app verification](https://firebase.google.com/docs/auth/android/phone-auth)
- [Auth Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth)
- [Expo native Firebase setup](https://docs.expo.dev/guides/using-firebase/)
- [Expo build properties](https://docs.expo.dev/versions/latest/sdk/build-properties/)

### Profile onboarding rollout

The fixed account-creation boundary is `2026-11-08T15:03:57.000Z` in `features/profile/profile-cohort.ts`. Accounts created before it with no required profile retain normal access; newer accounts must complete setup. Never move the boundary on subsequent releases or substitute last-sign-in time. This is a UX gate, not authorization for future features.

### Resumable profile storage

Profiles use owner-only `users/{uid}` Firestore documents and `firestore.rules`. Run `npm run test:profile-emulator` for actual Auth/Firestore lifecycle and rules checks (demo-cn360-connect, Auth9098, Firestore8088). Optional paired `EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST`/`EXPO_PUBLIC_FIRESTORE_EMULATOR_PORT` are development-only; use10.0.2.2 on Android. Never mix ESM and CommonJS Firestore instances in Node emulator tests; the test uses the same CommonJS Firebase distribution as tsx-transpiled project modules.

Before production release, enable/configure Cloud Firestore in the existing Firebase project and deploy the reviewed rules through the normal release process. Local implementation does not perform this deployment. Reads and acknowledged writes are required for setup; offline drafts are not claimed saved. Rules validate real dates and allow at most the latest local day worldwide (UTC+14); the app additionally checks the user's local today. This avoids rejecting valid birthdays around timezone midnight without collecting timezone data.
