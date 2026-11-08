# CamNorte 360

An Expo mobile foundation for CamNorte 360, a future tourism, real estate, and community application exclusively for Daet, Camarines Norte. This phase contains Figma onboarding, Figma-based email/password login/signup, password recovery, a pending-content native Terms page, guest/signed-in Figma Menu screens, a shared five-tab navigation shell, and minimal destination placeholders. Additional modules remain deferred. Geographic coverage is exclusively Daet, Camarines Norte, Philippines; other municipalities are excluded unless explicitly requested. The Expo slug, package identifiers, Firebase project IDs, deep-link scheme and storage keys retain their existing technical names.

## Platform priority

Android is the primary target. Prioritize Android implementation, native builds, and emulator/device checks. Defer iOS-specific testing unless explicitly requested. See `AGENTS.md` for durable project guidance.

## Start locally

Requires **Node 24.12+** (Node 24 LTS recommended), npm, and native Android build tooling (Expo Go does not include native Firebase Auth). Use `nvm use` if available.

Set up the matching Android Firebase client config and environment before running. See [Firebase setup](docs/firebase-setup.md) for live-project steps and a complete isolated Auth Emulator workflow that sends no SMS.

```sh
npm run android             # Primary: build/run with the Android SDK and Java 21
npm run ios                 # Deferred unless requested: requires Xcode and CocoaPods
npm run web                 # Optional browser smoke-test target
npm run typecheck
npm test -- --runInBand
npm run test:emulator        # Real SDK + demo Auth Emulator
npm run test:policy          # Real SDK policy-cache regression; all HTTP intercepted
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
- `features/auth/`: observed auth context, schemas, safe errors, guarded actions, and email/password/reset/Terms screens.
- `features/navigation/`: shared Poppins font readiness, router-based bottom tabs, safe auth return paths and minimal placeholders.
- `features/menu/`: guest/signed-in Menu presentation and existing auth actions.
- `features/onboarding/`: three Figma-based swipeable pages, local Poppins/assets, and shared locally persisted completion state.
- `services/firebase/`: environment validation, Firebase JavaScript email auth and native session compatibility adapters, persistence, lazy Firestore getter.
- `components/`, `theme/`, `constants/`: shared temporary presentation, Paper theme/tokens, and application name.

Firebase's observer is the source of authenticated state. Onboarding uses a separate provider and `useOnboarding` hook. The native splash remains until both initial reads settle; setup/storage failures have a recovery screen. Authenticated sessions take priority over onboarding. Guests browse the shell after onboarding, with Home as the default placeholder. Authentication is required at protected actions rather than app entry. Menu auth links preserve a strictly allowlisted return path. Logout retains the selected Menu beneath blocking progress/error recovery and reveals its guest state.

Onboarding uses the supplied Figma layout with the approved beach photo and Lucide palm tree, house, and users icons. Authentication forms use the inspected Public Sans Figma tokens, adapted to email/password with no email verification. Menu uses the inspected Authentication Flow frames and Poppins styles. Bottom tabs are Home, Explore, Properties, Community and Menu. The first four and secondary Menu destinations are placeholders; no booking, profile editing, saved-item storage, content modules, notification subscription or custom password-reset deep-link handling is implemented. Privacy/Terms legal content is pending. The old /welcome URL redirects to /home. Further content features still require their designs and approved scope.

See the [Menu/navigation plan](docs/superpowers/plans/2026-11-08-main-navigation-menu.md), [Menu/navigation design](docs/superpowers/specs/2026-11-08-menu-navigation-design.md), [approved foundation specification](docs/superpowers/specs/2026-11-04-auth-foundation-design.md), [implementation plan](docs/superpowers/plans/2026-11-04-auth-foundation.md), and [verification record](docs/verification.md) for scope and evidence.

The retained native session-compatibility adapter requires `google-services.json` for package `ph.cn360connect.app`. Email/password uses the existing Firebase JavaScript SDK with supported React Native session persistence. Enable Email/Password in Firebase Console; real SMS and a Blaze upgrade are not required for this flow. The matching Firebase Android app and local debug fingerprints are registered; the downloaded client JSON is local and Git-ignored. Public phone/SMS login has been retired. Existing sessions and accounts are preserved; phone-only account linking/migration remains deferred. Public Sans fonts come from [USWDS Public Sans](https://github.com/uswds/public-sans) under the included license. The OTP-named Figma frames contain profile setup; those are not part of this implementation.
