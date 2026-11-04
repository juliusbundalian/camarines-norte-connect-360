# Firebase setup

## Local demo project (no Firebase account required)

Use Node 24.12 or newer; Node 24 LTS is recommended (`nvm use` reads `.nvmrc`).

```sh
npm ci
cp .env.example .env.local
npm run emulators:auth
```

In another terminal:

```sh
npm start
```

The example points only to `demo-cn360-connect`. Auth listens on `127.0.0.1:9098`, Emulator UI on `127.0.0.1:4001`, hub on 4402, and logs on 4502. These ports avoid another emulator already present during development. Accounts are disposable and disappear when the emulator stops. The emulator prints password-reset links and exposes reset codes; it does not send email.

For an automated real-SDK check, stop this project's emulator first, then run:

```sh
npm run test:emulator
```

This starts and stops its own Auth Emulator. It exercises the actual TypeScript auth service via the development-only `tsx` runner, including reset codes. The persistence integration test uses Firebase's native adapter with an AsyncStorage-shaped in-memory test store; this is distinct from a process relaunch with native AsyncStorage.

### Simulator and physical-device hosts

- iOS simulator: the example `http://127.0.0.1:9098` reaches the Mac host.
- Android emulator: use `http://10.0.2.2:9098` in `.env.local`.
- Physical devices: use the computer's LAN address, and bind the Auth Emulator to a reachable interface in `firebase.json` for that local session. Keep the emulator on a trusted development network; never use emulator tokens with production resources.

Restart Metro after changing environment values (`npx expo start --clear` if values remain cached). Resolve port conflicts by changing both `firebase.json` and the local emulator URL.

## Configure a real Firebase project

1. Create or select your Firebase project in the Firebase Console.
2. Register a **web app**, even for the Expo mobile app: the Firebase JavaScript SDK uses its client configuration.
3. Under Authentication, enable the **Email/Password** sign-in provider. Email-link login is outside this phase.
4. Set the password-policy minimum to **8 characters**, matching registration validation. The client also displays Firebase failures for stronger server requirements; if you add complexity rules later, update the form guidance and validation at the same time.
5. Enable **email enumeration protection**. Password-reset confirmation always uses neutral wording, including legacy account-not-found responses. This does not make Firebase's entire registration API anonymous: Firebase can still reject an already-registered email.
6. Copy the web app's `apiKey`, `authDomain`, `projectId`, and `appId` into the corresponding `EXPO_PUBLIC_FIREBASE_*` entries in `.env.local`. Storage bucket and sender ID are optional for this phase. These are public client identifiers, not Admin SDK credentials.
7. **Remove `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL`** when using the real project. Do not set it in release-build environments: production initialization rejects emulator configuration.
8. Review Authentication's password-reset email template, sender configuration, and authorized domains. Retain Firebase's default hosted action handler. Test delivery with a mailbox you control; check spam filtering and applicable Firebase quotas.
9. Restart the app and verify registration, login, reset-email delivery, and logout in the intended project. No Console credentials or cloud project were provided during implementation, so live email delivery is a separate verification step.

The checked-in `.firebaserc` intentionally remains a demo project for emulator commands. No cloud resources, security rules, Firestore collections, or Storage integration are provisioned by this project. `getFirestoreDb()` prepares lazy initialization for later approved features.

Never put service-account JSON, Admin SDK keys, passwords, or private credentials in `EXPO_PUBLIC_*` values. Local environment files are ignored; `.env.example` is tracked. Firebase session data is managed by the SDK's supported React Native AsyncStorage persistence adapter; the app does not store credentials itself. AsyncStorage is not encrypted keychain storage.

## References

- [Expo Firebase setup](https://docs.expo.dev/guides/using-firebase/)
- [Firebase password authentication and password policy](https://firebase.google.com/docs/auth/web/password-auth)
- [Manage users and password-reset emails](https://firebase.google.com/docs/auth/web/manage-users)
- [Auth Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth)
- [Firebase persistence API](https://firebase.google.com/docs/reference/js/auth.md#getreactnativepersistence)
