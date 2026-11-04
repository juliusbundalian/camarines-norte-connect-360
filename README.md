# CAMARINES NORTE 360 CONNECT

An Expo mobile foundation for Camarines Norte's future tourism, real estate, and community application. This phase contains only onboarding, email authentication, password recovery, and an authenticated placeholder. Official Figma designs and additional modules are deferred.

## Platform priority

Android is the primary target. Prioritize Android implementation, native builds, and emulator/device checks. Defer iOS-specific testing unless explicitly requested. See `AGENTS.md` for durable project guidance.

## Start locally

Requires **Node 24.12+** (Node 24 LTS recommended), npm, and Expo Go or native build tooling. Use `nvm use` if available.

```sh
npm ci
cp .env.example .env.local
npm run emulators:auth
```

In a second terminal:

```sh
npm start
```

The example requires the local Auth Emulator. For real Firebase or device-specific host addresses, see [Firebase setup](docs/firebase-setup.md). Stop this project's emulator before running automated emulator tests.

```sh
npm run android             # Primary: build/run with the Android SDK and Java 21
npm run ios                 # Deferred unless requested: requires Xcode and CocoaPods
npm run web                 # Optional browser smoke-test target
npm run typecheck
npm test -- --runInBand
npm run test:emulator        # Real SDK + demo Auth Emulator
npx expo install --check
npx expo-doctor
```

To validate exports with the demo configuration, disable its development-only emulator variable for the production bundle:

```sh
EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL='' npx expo export --platform all
```

A production app needs real Firebase client configuration and no emulator URL. Never ship the demo values as a working production authentication configuration.

For local Android builds on macOS, point Gradle at the Android SDK and Java 21 if they are not already configured:

```sh
export ANDROID_HOME="$HOME/Library/Android/sdk"
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

Use the Auth Emulator host `10.0.2.2:9098` from the Android emulator, or retain the local example URL and forward it with `adb reverse tcp:9098 tcp:9098`. Keep this forwarding limited to local development.

## Structure

- `app/`: route wrappers, splash/readiness gate, and Expo Router protected groups.
- `features/auth/`: observed auth context, schemas, safe errors, guarded actions, temporary forms and welcome screen.
- `features/onboarding/`: three swipeable pages and shared locally persisted completion state.
- `services/firebase/`: environment validation, native/browser persistence clients, centralized auth service, lazy Firestore getter.
- `components/`, `theme/`, `constants/`: shared temporary presentation, Paper theme/tokens, and application name.

Firebase's observer is the source of authenticated state. Onboarding uses a separate provider and `useOnboarding` hook. The native splash remains until both initial reads settle; setup/storage failures have a recovery screen. Authenticated sessions take priority over onboarding. Logout and route guards remove access to the previous session's screens.

The UI deliberately uses simple temporary Paper layouts. Future Figma work can replace components, tokens, and screen presentation while preserving services, validation, state, and navigation. No Home Screen, tabs, feature portals, profile fields, or custom password-reset deep-link handling exist.

See the [approved specification](docs/superpowers/specs/2026-11-04-auth-foundation-design.md), [implementation plan](docs/superpowers/plans/2026-11-04-auth-foundation.md), and [verification record](docs/verification.md) for scope and evidence.
