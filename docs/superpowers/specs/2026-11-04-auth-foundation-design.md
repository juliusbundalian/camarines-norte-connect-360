# CAMARINES NORTE 360 CONNECT — Initial foundation

Date: 2026-11-04 (Asia/Manila)
Status: Approved by the user on 2026-11-04; implementation plan approved; user selected Native execution.

## Intent and boundaries

Build a maintainable Expo mobile foundation for Camarines Norte's future real estate, tourism, and community application. This phase delivers only native splash management, three onboarding pages, email/password login and registration, password recovery, session restoration, protected navigation, and an authenticated placeholder with logout.

No Home Screen, tabs, tourism, real estate, community modules, profiles, email-verification gate, social login, custom password-reset links, backend, or feature-level plans. Official Figma designs will replace temporary presentation later without rewriting authentication logic. Do not invent those future designs.

The repository currently contains only README.md and LICENSE. There is no application or Firebase configuration to preserve.

## Approaches and decisions

1. **Selected by the user:** separate authentication context and onboarding hook. Firebase is the authority for session state; onboarding persistence is an independent local concern. A small provider exposes one shared onboarding hook instance so screens cannot accidentally create separate state copies.
2. **Considered:** one combined session provider. This reduces file count but couples unrelated state and persistence; the user selected the separate approach.

Use the requested Expo/React Native/strict TypeScript stack with Expo Router, React Native Paper, StyleSheet, centralized tokens, Expo Image, and Lucide React Native as needed. Use Firebase's JavaScript SDK, React Hook Form, Zod, AsyncStorage, Expo Splash Screen, Jest, and React Native Testing Library. Zustand is unnecessary for this phase.

Resolve current stable packages at implementation time. Let Expo choose compatible native package versions with `expo install`; commit a lockfile, run dependency compatibility checks, and avoid prereleases. Runtime and tool versions must satisfy the selected Expo release. npm is the default package manager.

## Architecture

```text
app/                         # Route wrappers and layouts only
  _layout.tsx                # Providers, readiness gate, protected route groups
  index.tsx                  # Deterministic initial redirect
  onboarding.tsx
  (auth)/                    # Login, register, forgot-password
  (app)/welcome.tsx          # Authenticated placeholder only
components/                  # Shared form/screen presentation
features/auth/               # Screens, AuthProvider/useAuth, schemas, form behavior
features/onboarding/         # Screens, content, shared hook/provider, persistence
services/firebase/           # Environment parsing, app/auth initialization, auth service
theme/                       # Paper theme and shared color/type/spacing tokens
constants/                   # Application name and other shared constants as needed
docs/                        # Setup, design, implementation plan, validation notes
```

Create other directories only when they contain useful code. Keep functions and hooks straightforward; no repository pattern, dependency container, custom state machine library, or generic form framework.

The Firebase service centralizes login, registration, reset, logout, observation, and safe error translation. Screens consume auth actions through the context. Form validation and presentation stay outside Firebase initialization. The onboarding provider owns its local storage operations and exposes state through `useOnboarding`.

## Startup, persistence, and navigation

1. Call Expo Splash Screen's prevent-auto-hide API at module scope, configure a simple local temporary brand asset, and initialize Firebase once. Do not use timers to simulate startup.
2. Restore onboarding completion and subscribe to Firebase `onAuthStateChanged` independently. The first Firebase callback, including a null user, resolves auth readiness. Never infer restoration completion from `auth.currentUser` alone.
3. Keep the native splash visible until both reads settle and the application can render a destination or recoverable startup error. Hide it when that ready UI is mounted. No public or protected screen renders during unresolved restoration.
4. Select destinations in this order: authenticated user → `/welcome`; unauthenticated with onboarding incomplete → `/onboarding`; unauthenticated with onboarding complete → `/login`. An existing authenticated session takes precedence over missing onboarding completion.
5. Use Expo Router `Stack.Protected` guards for onboarding, public auth, and authenticated routes. The index route chooses the initial destination. Guards also apply to direct links, back navigation, and changes to authentication state; users cannot return to auth forms after login or to the placeholder after logout.
6. Completing or skipping onboarding must successfully persist a versioned completion flag before enabling the login destination. A failed read/write displays a retryable error and does not silently claim success. An unreadable completion flag blocks onboarding-dependent public navigation until retry succeeds; a missing flag means incomplete.
7. Initialize native Auth using `initializeAuth` with Firebase's `getReactNativePersistence` and Expo-compatible AsyncStorage. Let the SDK manage session tokens; never manually store passwords or credentials. This supported adapter uses AsyncStorage; it is not a promise of encrypted keychain storage. Any web smoke-test target uses an appropriate Firebase browser persistence implementation.
8. Unsubscribe observers on cleanup, handle Fast Refresh without duplicate initialization, and surface initialization/listener errors through a small startup recovery state. Missing configuration must show a useful setup error instead of an indefinite splash or mock authentication.

Auth actions rely on the auth observer for user changes and navigation. Do not optimistically grant access from a form response or create a second manually persisted user store. Logout failures keep the current authenticated state and provide retry feedback. Logout returns to login when onboarding was completed; otherwise it returns to onboarding.

## Temporary screens and interaction

Use Paper inputs/buttons and reusable safe-area, keyboard-aware scrolling layouts. All form controls have visible labels, useful accessibility labels, field errors, loading indicators, and adequate touch targets. Use a restrained temporary theme and simple local placeholders; colors, type, spacing, radii, and reusable sizes live in tokens. Support narrow screens, keyboard entry, and readable text scaling. No elaborate illustrations or animation work.

### Onboarding

Use a horizontally paged React Native list with three pages:

- **Discover Camarines Norte:** local destinations, attractions, and cultural experiences.
- **Explore Real Estate Opportunities:** convenient exploration of property opportunities throughout Camarines Norte.
- **Connect with the Community:** local news, community information, events, and surveys.

Provide swipe navigation, Next, Back after page one, Skip, accessible page indicators, and Get Started on page three. Keep the visible page and controls synchronized after swipes and layout changes. Skip and Get Started share the same persistent completion operation and prevent duplicate writes. Buttons remain a usable alternative to gestures.

### Login and registration

Login contains email/password inputs, password visibility toggle, Login, Forgot Password, and Register navigation. Registration adds confirm password, independently usable password visibility controls, Register, and Back to Login.

Validate with React Hook Form and Zod. Trim email surrounding whitespace; never trim or transform passwords. Require a valid email, a nonempty login password, and matching registration passwords. **Builder proposal:** registration requires at least eight characters; document matching Firebase Console password policy and honor additional server-side policy errors without inventing character-composition rules.

Use `signInWithEmailAndPassword` and `createUserWithEmailAndPassword`. Registration signs the new user in through Firebase and therefore opens the placeholder through the observer. Disable submission while pending and use a synchronous submission guard to reject duplicate taps. Preserve inputs on recoverable errors; clear error feedback when retrying. Do not log passwords or display raw Firebase errors.

Map invalid credentials to a neutral sign-in error, existing registration email to an actionable registration error, and network/rate-limit/disabled-account/configuration failures to appropriate safe messages. Unknown failures receive a useful generic retry message. Back/navigation behavior must not cause an unmounted form to update local state after an outstanding request.

### Password recovery

Use one forgot-password route with email validation and `sendPasswordResetEmail`. On successful request, show an in-screen confirmation: “If an account exists for this email address, you will receive a password reset link.” Treat account-not-found responses the same way; do not query sign-in methods or reveal account existence. Network, rate-limit, and other request failures remain retryable errors. Prevent duplicate requests.

The confirmation includes Back to Login. Use Firebase's default hosted reset flow and email template. No custom reset route or deep-link handler. Document Firebase email-enumeration protection and its limitations; the client message must not depend on whether the email exists.

### Authenticated placeholder

Show the application name, a simple welcome, authenticated email, Logout, and “The main application is awaiting its official Figma designs.” No bottom navigation or feature entry points.

## Firebase configuration and local development

Supply `.env.example` with `EXPO_PUBLIC_FIREBASE_*` client configuration values and a development-only opt-in Auth Emulator host/port. Ignore local environment files while tracking the example. Firebase client configuration is bundled public configuration, not a service-account credential. Do not include Admin SDK keys or private credentials.

Validate required values before initialization. Emulator connections must be explicit, happen before auth operations, and be disallowed in production builds. Default validation uses a local demo Firebase project so it does not require a live account or mutate production users. Document localhost/device network differences.

Prepare/export lazy Firestore initialization for future use; make no queries, collections, security-rule deployments, or Storage integration. Document registering a Firebase web app for the JS SDK, enabling Email/Password Authentication, configuring password policy and enumeration protection, copying client configuration, and checking reset email templates/authorized domains. Do not provision cloud resources as part of this implementation.

## Phases and verification strategy

This is the design-level sequence; the detailed implementation plan follows design approval.

1. **Foundation:** initialize Expo Router and strict TypeScript, compatible dependencies, temporary theme/branding, splash config, Firebase environment boundary, Jest setup, and documentation scaffolding.
2. **State and navigation:** test and implement auth service/provider, native persistence, onboarding persistence, readiness/error handling, and protected route selection.
3. **Temporary flows:** test and implement paged onboarding, login, registration, password recovery/confirmation, and the authenticated placeholder with logout.
4. **Verification and handover:** run static checks, meaningful component/navigation tests, real-SDK Auth Emulator integration tests, a Metro bundle/export check, and available native smoke checks; review against scope and document exact outcomes and remaining manual checks. Stop for Figma.

Use test-driven development for behavior: write and observe failing tests before the corresponding implementation. Prioritize validation edge cases, generic reset responses, duplicate-submit prevention, Firebase error translation, subscription cleanup, startup readiness ordering, storage failures, guard behavior, and onboarding completion. UI tests should exercise interactions and observable outcomes rather than mirror component structure.

Run emulator integration coverage for account creation, login, invalid credentials, duplicate email, reset requests/action codes, logout, and SDK persistence restoration where the harness can meaningfully exercise it. Mock-based tests alone cannot prove real Firebase authentication. The emulator does not deliver real email; inspect its generated reset link/action code. Cloud email delivery requires configured Firebase and a live mailbox check.

Verify native relaunch/session restoration and splash/no-flicker behavior on an available simulator/device. A web export or Node integration test alone cannot certify native persistence or the native splash. Splash appearance needs a development/release build because Expo Go is not a complete splash validation target. Report unavailable checks as unverified, without claiming acceptance criteria passed.

## Approval and completion boundary

The user approved the architecture choice and this full specification. Write a concise phased implementation plan and obtain its workflow-required review before execution, then execute small verifiable tasks, review the result, and report evidence against the acceptance criteria. Any environment-dependent gaps must be explicit.

After this scope is implemented, stop. Further screens or modules require the user's official Figma designs and explicit development scope.

## Reference documentation

- Expo Firebase SDK setup: https://docs.expo.dev/guides/using-firebase/
- Expo Router authentication: https://docs.expo.dev/router/advanced/authentication/
- Firebase React Native persistence: https://firebase.google.com/docs/reference/js/auth.md#getreactnativepersistence
- Expo Splash Screen: https://docs.expo.dev/versions/latest/sdk/splash-screen/
- Firebase Auth Emulator: https://firebase.google.com/docs/emulator-suite/connect_auth
