# Authentication Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver only the Expo onboarding and Firebase email authentication foundation, ready for future Figma layouts.

**Architecture:** Lightweight Expo Router routes render feature screens. AuthProvider owns Firebase-observed session state; an independent onboarding provider exposes one shared persistence hook. Services, validation, and temporary token-based presentation remain separate.

**Tech Stack:** Expo, React Native, strict TypeScript, Expo Router, Paper, StyleSheet, Expo Image, Lucide where useful, Firebase JS SDK, React Hook Form/Zod, AsyncStorage, Expo Splash Screen, Jest/RNTL.

**Spec:** `docs/superpowers/specs/2026-11-04-auth-foundation-design.md` (approved 2026-11-04).

## Global Constraints

- No Home Screen, tabs, tourism, real estate, community modules, profiles, email-verification gate, social login, custom password-reset links, backend, or feature-level plans.
- Official Figma designs will replace temporary presentation later without rewriting authentication logic.
- Resolve current stable packages at implementation time. Let Expo choose compatible native package versions with `expo install`; commit a lockfile, run dependency compatibility checks, and avoid prereleases.
- npm is the default package manager. No Zustand, custom backend, manual credential storage, or unnecessary abstractions.
- Registration requires at least eight characters; email whitespace is trimmed, passwords are never transformed.
- Authenticated user → `/welcome`; unauthenticated with onboarding incomplete → `/onboarding`; unauthenticated with onboarding complete → `/login`.
- Default validation uses a local demo Firebase project; never provision cloud resources or create Firestore collections.
- Observe each behavioral test fail before implementing it. Tests of configuration/scaffolding alone are unnecessary.

## Review Focus

- A late auth callback after retry/unmount must not overwrite the current subscription (Task 2 lifecycle tests).
- Missing/corrupt/unreadable onboarding data and failed writes must not incorrectly complete onboarding (Task 3 persistence tests).
- Swiping followed by rotation or a narrower viewport must preserve the active onboarding page and usable controls (Task 3 interaction tests).
- Password spaces/Unicode, rapid taps, and leaving a pending form must preserve credential bytes and prevent duplicate/unmounted updates (Tasks 2 and 4).
- Opening a protected deep link during restoration or after logout must not expose the placeholder or stale form history (Task 5 router tests).

---

### Task 1: Runnable project and Firebase configuration boundary

**Files:** Create `package.json`, `package-lock.json`, `app.config.ts`, `tsconfig.json`, `jest.config.js`, `jest.setup.ts`, `.gitignore`, `.env.example`, `assets/brand.png`, `theme/tokens.ts`, `theme/index.ts`, `constants/app.ts`, `services/firebase/config.ts`, `services/firebase/client.native.ts`, `services/firebase/client.web.ts`, `services/firebase/client.ts`, `services/firebase/__tests__/config.test.ts`. Modify `README.md`.

**Interfaces:** `readFirebaseConfig(env: FirebaseEnvironment, development: boolean): FirebaseConfiguration` validates the explicitly listed public Firebase fields and optional emulator URL. Platform clients expose `getFirebaseAuth(): Auth`, `getFirebaseApp(): FirebaseApp`, and lazy `getFirestoreDb(): Firestore`; the base client supplies a resolvable fallback for TypeScript/test tooling. Theme exports `theme` and `tokens`; constants export `APP_NAME`.

- [x] Establish an isolated branch/worktree using the execution workflow. Initialize a minimal Expo Router TypeScript project while preserving LICENSE and docs. Set `main` to `expo-router/entry`; use Expo-compatible package versions. Add scripts `start`, `android`, `ios`, `web`, `typecheck`, `test`, `test:emulator`, and `emulators:auth`. Configure `jest-expo`, strict TypeScript, and environment ignore rules. Do not retain template feature screens.
- [x] Write configuration tests: missing required fields produce actionable errors; valid demo config parses; malformed emulator URLs fail; any production emulator opt-in fails. Assert `expect(() => readFirebaseConfig(emulatorEnv, false)).toThrow(/emulator/i)` and valid production configuration has no emulator connection.
- [x] Run `npm test -- --runInBand services/firebase/__tests__/config.test.ts`; observe failure from the missing parser.
- [x] Implement config parsing and lazy platform initialization. Native Auth uses `initializeAuth`/`getReactNativePersistence` with compatible AsyncStorage; web uses browser persistence. Reuse initialized clients under Fast Refresh. Connect an explicitly enabled development emulator before any auth operations. Do not initialize Firestore until its getter is called.
- [x] Add centralized temporary Paper tokens and local brand asset, and configure Expo Router/Splash Screen plugins. Use a simple generated asset without spending time on visual design.
- [x] Run the configuration test, `npm run typecheck`, and `npx expo install --check`; require exit 0. Commit this foundation with its lockfile and setup instructions.

### Task 2: Auth service, validation, and observed session lifecycle

**Files:** Create `services/firebase/auth-service.ts`, `features/auth/errors.ts`, `features/auth/schemas.ts`, `features/auth/AuthProvider.tsx`, `features/auth/useAsyncAction.ts`, and corresponding `__tests__/auth-service.test.ts`, `schemas.test.ts`, `AuthProvider.test.tsx`, `useAsyncAction.test.tsx` beside their owning modules.

**Interfaces:** `getAuthService(): AuthService` returns `login(email, password): Promise<void>`, `register(email, password): Promise<void>`, `requestPasswordReset(email): Promise<void>`, `logout(): Promise<void>`, and `observe(next: (user: User | null) => void, error: (error: unknown) => void): Unsubscribe`. `useAuth()` exposes those actions plus `{ user: User | null, ready: boolean, error: string | null, retry(): void }`. Export `loginSchema`, `registrationSchema`, `resetPasswordSchema` and their inferred form types. `getAuthErrorMessage(error: unknown): string` translates safe messages. `useAsyncAction()` exposes `{ pending, error, run(action: () => Promise<void>): Promise<boolean>, clearError(): void }` with a synchronous duplicate guard and mounted-state cleanup.

- [x] Write tests that assert SDK calls receive unchanged password bytes (`' pässword '`) and normalized email; seven-character registration passwords and mismatched confirmation fail; eight-character matching passwords pass; an empty login password fails without applying registration minimum length to existing users.
- [x] Write reset tests that account-not-found resolves normally, while network and rate-limit errors reject. Assert credential errors are neutral and unknown errors do not expose raw SDK messages.
- [x] Write provider/hook tests: readiness waits for the first observer event (including null), action results alone do not grant access, retry replaces/unsubscribes the old listener, stale callbacks are ignored, and cleanup unsubscribes. Assert `expect(login).toHaveBeenCalledTimes(1)` after two simultaneous `run` calls; pending failures release the guard; unmount does not update UI.
- [x] Run the Task 2 test files with `npm test -- --runInBand`; observe the missing implementations fail.
- [x] Implement the thin service using the four requested Firebase functions and `onAuthStateChanged`; implement schemas, safe errors, auth context, and the focused async-action hook. Handle configuration/observation failure as settled error state with retry. Never manually persist user/session data.
- [x] Run Task 2 tests plus `npm run typecheck`; require all pass. Commit auth logic and tests.

### Task 3: Persistent three-page onboarding

**Files:** Create `features/onboarding/OnboardingProvider.tsx`, `features/onboarding/content.ts`, `features/onboarding/OnboardingScreen.tsx`, `features/onboarding/__tests__/OnboardingProvider.test.tsx`, and `features/onboarding/__tests__/OnboardingScreen.test.tsx`.

**Interfaces:** `useOnboarding()` returns `{ completed: boolean, ready: boolean, error: string | null, saving: boolean, complete(): Promise<void>, retry(): void }`. Persist key `@cn360/onboarding/v1` with value `complete`; absent or invalid values mean incomplete, failed reads are retryable errors. `OnboardingScreen(): React.JSX.Element` consumes this shared provider; navigation follows state through Task 5 guards.

- [x] Write storage tests for missing/completed/corrupt values, rejected reads, successful retry, and a rejected completion write: `expect(result.current.completed).toBe(false)` until `setItem` resolves. Assert concurrent completion attempts cause one write and failed writes allow retry.
- [x] Write interaction tests for the exact three approved headings, Next/Back, swipe index updates, final Get Started, Skip, accessible pagination labels, and storage errors. Simulate viewport changes after page two and assert the active page remains page two and the list scrolls to its new offset. Skip and Get Started each invoke the shared completion operation.
- [x] Run `npm test -- --runInBand features/onboarding`; observe failure before implementation.
- [x] Implement provider cleanup/retry and a horizontal paged list with token-based layout, optional Expo Image local placeholder, synchronized page state, and button alternatives. Rejected writes stay on onboarding with retry feedback. Render no tourism/property/community feature content beyond the approved onboarding copy.
- [x] Run onboarding tests and `npm run typecheck`; require all pass. Commit onboarding behavior.

### Task 4: Temporary auth forms and authenticated placeholder

**Files:** Create `components/Screen.tsx`, `components/PasswordField.tsx`, `features/auth/LoginScreen.tsx`, `features/auth/RegisterScreen.tsx`, `features/auth/ForgotPasswordScreen.tsx`, `features/auth/WelcomeScreen.tsx`, and `features/auth/__tests__/auth-screens.test.tsx`.

**Interfaces:** Each screen exports a default zero-argument React component. `Screen` accepts children and provides safe-area/keyboard-aware scrolling. `PasswordField` accepts Paper text-input props, a label, and its own accessible visibility toggle. Screens consume Task 2 schemas/context/action hook, use React Hook Form/Zod, and link only to `/login`, `/register`, and `/forgot-password`.

- [x] Write user interaction tests: invalid input prevents submission; corrected input submits normalized email and untouched password; visibility toggles work independently; double taps submit once; recoverable errors preserve fields and enable retry; leaving a pending screen causes no local state update. Verify Forgot Password/Register/Login links target their respective routes.
- [x] Write recovery tests asserting the exact generic confirmation appears for existing and nonexistent accounts, network failures retain the form, and confirmation returns to login. Assert the recovery API is not called for an invalid email.
- [x] Write placeholder tests for application name, welcome, email, exact Figma-awaiting message, logout pending state, and retryable logout errors. The observer remains the source of navigation after logout.
- [x] Run `npm test -- --runInBand features/auth/__tests__/auth-screens.test.tsx`; observe failure before implementation.
- [x] Implement the reusable layout/visibility controls and four minimal Paper screens. Use `Controller`, field-level errors, correct keyboard/autofill settings, safe error feedback, and guarded submission. The reset confirmation stays within the forgot-password route. Add no other screens or feature entry points.
- [x] Run screen tests and `npm run typecheck`; require all pass. Commit temporary auth presentation.

### Task 5: Splash readiness and protected Expo Router navigation

**Files:** Create `app/_layout.tsx`, `app/index.tsx`, `app/onboarding.tsx`, `app/(auth)/_layout.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/(auth)/forgot-password.tsx`, `app/(app)/welcome.tsx`, `components/StartupError.tsx`, `features/auth/__tests__/navigation.test.tsx`. Root-level tests stay outside `app/` so Expo Router never treats them as routes.

**Interfaces:** `RootLayout` mounts SafeArea/Paper/Auth/Onboarding providers, then the readiness gate and router. `index.tsx` selects the approved destination. Root `Stack.Protected` guards allow onboarding only for unauthenticated incomplete onboarding, auth only for unauthenticated completed onboarding, and welcome only for an observed authenticated user. Route files only re-export feature screens.

- [x] Using Expo Router's testing-library `renderRouter` with controlled auth/storage adapters, write tests for both restoration completion orders and no visible route before both settle. Assert restored users open welcome even with a missing onboarding flag; unauthenticated first launch opens onboarding; completed onboarding opens login.
- [x] Write deep-link and history tests: unauthenticated `/welcome` is guarded, authenticated `/login` resolves to welcome, completing onboarding unlocks auth, observer login removes public history, and observer logout removes welcome history. Also test initialization errors, failed storage reads, retry, and observer failure: a usable recovery UI appears and splash hide is called when that UI mounts.
- [x] Run `npm test -- --runInBand features/auth/__tests__/navigation.test.tsx`; observe failure before implementation.
- [x] Implement native splash prevention at module scope and hide only when a settled destination/error UI mounts; add no artificial delay. Render no navigator while restoring, use protected groups rather than per-screen auth effects, and handle authenticated precedence explicitly. Recover startup failure without indefinite loading or duplicate observers.
- [x] Run navigation tests, the full Jest suite, `npm run typecheck`, and `npx expo install --check`; require all pass. Commit routing and splash integration.

### Task 6: Real-SDK verification, documentation, and final review

**Files:** Create `firebase.json`, `.firebaserc` (demo project only), `scripts/auth-emulator.test.mjs`, `docs/firebase-setup.md`, `docs/verification.md`. Modify package scripts, README, and this plan's completed checkboxes. Install Firebase CLI only as development tooling if needed; no Admin SDK application dependency.

**Interfaces:** `npm run emulators:auth` starts only Auth with demo project `demo-cn360-connect`; `npm run test:emulator` uses CLI `emulators:exec --only auth` to run `node --test scripts/auth-emulator.test.mjs`. The script imports the real Firebase JS SDK; emulator network calls must never target a live project. Document emulator host overrides for physical devices and Android emulators.

- [x] Write real-SDK integration tests for registration, duplicate email, logout, login, wrong password, neutral reset request for a missing account, generated reset action code retrieval, hosted-reset-equivalent `confirmPasswordReset`, and login with the new password. Use unique per-test addresses and emulator-only REST endpoints for reset code inspection. Run before final verification and diagnose any discrepancy rather than weakening assertions.
- [x] Exercise SDK session restoration using an AsyncStorage-shaped test adapter and a fresh Auth instance if supported by the actual package exports; clearly distinguish this from native relaunch verification. If the harness cannot exercise the native adapter, document that limit and retain native persistence verification as an explicit device check.
- [x] Run `npm run test:emulator`, `npm test -- --runInBand`, `npm run typecheck`, `npx expo install --check`, `npx expo-doctor`, and `npx expo export --platform all` with valid demo configuration. Require success or document an exact environmental blocker; fix implementation failures.
- [x] Inspect available simulator/device/build tools. Start Expo and verify Metro starts successfully. Where available, smoke-test onboarding swipes/buttons, keyboard forms, real emulator registration/login/reset/logout, fresh launch routes, process relaunch session persistence, back/deep-link guards, and startup errors. Validate native splash in a development/release build. Never substitute export success for a completed device check.
- [x] Document Firebase Console setup (Email/Password, minimum-eight policy, enumeration protection, web client config, reset email templates/domains), environment setup, commands, architecture, temporary design boundary, known verification gaps, and a checked/unchecked acceptance checklist. Live reset-email delivery needs a configured cloud project/mailbox; do not claim the emulator sent real email.
- [x] Use the required Superpowers code-review workflow to obtain a fresh whole-change review against this approved spec and plan. Fix substantive findings and rerun affected checks. Verify no out-of-scope routes/modules, private credentials, tracked local env files, or unnecessary Firestore/Storage access.
- [x] Record actual command outcomes and manual checks in `docs/verification.md`, mark implemented plan steps, run `git diff --check`, and commit the completed foundation. Follow the branch finishing workflow and stop for Figma; do not add features after handover.

## Plan self-review and execution checkpoint

Execution record: code and automated checks completed. Native interaction checks limited by the locked Mac and live-project checks limited by absent cloud configuration; see `docs/verification.md` for the unchecked acceptance items. Review found one important action-layout issue, fixed with a failing-then-passing regression; two minors are documented for follow-up.

Spec coverage: Tasks 1–2 cover initialization, tokens, Firebase services/configuration, validation, and session persistence; Task 3 covers onboarding; Task 4 covers all requested auth UI; Task 5 covers splash/route protection; Task 6 covers real SDK validation, setup instructions, review, and the Figma stop boundary. Each Review Focus item has explicit behavioral coverage in its owning task. Shared service/hook names and return types agree across tasks.

Recommended execution: **Native**, using `superpowers:executing-plans`, because the six tasks share provider, service, and route interfaces and benefit from one implementer maintaining that context. A fresh reviewer checks the complete result before handover. The user approved this plan and selected Native execution.
