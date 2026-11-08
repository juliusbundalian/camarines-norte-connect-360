# Email and Password Return Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Restore email/password login and registration within the existing Figma auth UI, without email verification.

**Architecture:** Reuse the existing Firebase JavaScript email service, schemas, AuthProvider, persistence and protected routing. Reuse AuthScaffold and centralized auth tokens. Keep existing session restoration/logout compatibility; remove SMS entry, consent, verification routing and its provider from the public flow, without deleting Firebase accounts or changing Console configuration.

**Tech Stack:** Existing Expo/TypeScript, React Hook Form/Zod, Firebase, Jest/RNTL; no new dependencies.

**Spec:** User request dated 2026-11-08, with the bounded description below; existing visual reference in `docs/superpowers/specs/2026-11-06-login-registration-findings.md`.

## Description for approval

Keep the supplied Figma login/register layout, Public Sans typography, existing logo, colors, field/button styling and spacing. Replace Mobile number with Email and remove +63/SMS consent. Login has email, password with show/hide, Login, Forgot Password and Register navigation. Registration has email, password and confirm password with show/hide, Register and Login navigation. Restore the Figma password-rule indicators and matching-password validation. Use Firebase JavaScript SDK validatePassword with the same auth instance to reflect the configured policy (last inspected: minimum 8, uppercase, lowercase, digit and symbol); Firebase remains authoritative, and no policy setting is changed. Registration signs in immediately: no email-verification email, verification screen, polling or emailVerified gate. Password recovery still sends a reset email through Firebase's hosted reset flow and gives an account-neutral confirmation. The native Terms page remains content pending, without claiming acceptance of missing terms. Keep onboarding, splash and authenticated placeholder. Preserve existing accounts and restored sessions. Existing phone-only accounts will have no public phone login after logout; account linking/migration is outside this change.

## Global Constraints

- Android is primary; native Android build and emulator checks required. Defer iOS testing.
- No email verification, SMS requests, billing changes, new account providers or profile fields.
- No Home, tabs, tourism, real-estate or community modules.
- Do not clear live app data, record passwords, delete accounts or automatically submit live credentials.
- Preserve the existing uncommitted DNS documentation and billing-error fix.

## Review Focus

- Unverified email accounts must reach the placeholder after successful login/registration (Task 1).
- Repeated taps must issue only one pending auth request (Task 1).
- Firebase policy rejection and invalid credentials must retain recoverable form state without exposing server payloads (Task 1).
- A cold obsolete OTP deep link must return safely to Login without sending SMS (Task 2).
- Restoration and logout errors must remain visible across route changes (Task 2).

### Task 1: Figma email/password forms and password recovery

**Files:** Modify `features/auth/LoginScreen.tsx`, `RegisterScreen.tsx`, `ForgotPasswordScreen.tsx`, `AuthScaffold.tsx`, `errors.ts` only as required; reuse `useAsyncAction.ts`, `AuthProvider.tsx` and `theme/auth.ts`; adapt `schemas.ts` and add a narrowly scoped password-policy helper in `services/firebase/` if needed. Update `features/auth/__tests__/auth-screens.test.tsx`, `schemas.test.ts` and focused form tests.

**Interfaces:** Consume `useAuth().login(email,password)`, `.register(email,password)`, `.requestPasswordReset(email)` (all `Promise<void>`); existing schema types `LoginFields`, `RegistrationFields`, `ResetPasswordFields`. Produce the existing default route screen components; if extracted, `checkPasswordPolicy(password: string): Promise<PasswordValidationStatus>` wraps Firebase validatePassword using the existing JS auth instance.

- [x] Add failing RNTL tests: valid email/password invokes the correct action; missing/invalid email, empty login password, short signup password, unmet Firebase password requirements and mismatch block submission; passwords toggle visibility; a pending promise blocks duplicate submissions; rejected credentials/policy/network failures show safe guidance; successful unverified registration needs no verification step. Password reset displays an account-neutral confirmation and Back to Login.
- [x] Run `npm test -- --runInBand features/auth/__tests__/auth-screens.test.tsx features/auth/__tests__/schemas.test.ts` plus any added form test files; verify the intended failures.
- [x] Implement the forms with the existing scaffold/tokens and schemas, keyboard/autofill/accessibility props, loading/error handling and guarded submissions. Use `validatePassword(getFirebaseAuth(), password)` for configured-policy feedback before registration and test policy lookup failure/retry without logging candidates. Restore Forgot Password navigation and adapt its existing functional screen to the auth scaffold without inventing a new visual design.
- [x] Run the focused tests; expect all passing. Commit only Task 1 files.

### Task 2: Retire the public SMS flow and verify session navigation

**Files:** Modify `app/(auth)/_layout.tsx`, `app/(auth)/verify-phone.tsx`, `features/auth/WelcomeScreen.tsx`, `AGENTS.md`; remove unused `features/auth/PhoneEntryScreen.tsx`, `PhoneVerificationProvider.tsx`, `VerifyPhoneScreen.tsx` and their UI-only tests after replacing relevant coverage. Preserve native adapter/session compatibility and its regression tests.

**Interfaces:** Existing `AuthProvider` readiness/user/logout state and Expo Router protected groups remain the routing authority. Obsolete `/verify-phone` becomes a redirect to `/login`; no confirmation state is created.

- [x] Add failing navigation tests: cold OTP link redirects to Login, public layout needs no PhoneVerificationProvider, unverified email user can access protected placeholder, restored sessions do not flash Login, logout/error retry remains functional.
- [x] Run focused navigation/provider tests and verify intended failures.
- [x] Remove public SMS wiring and unused UI, retain harmless legacy route redirect, display email preferentially on the placeholder with phone fallback for existing sessions, and update approved scope in AGENTS.md. No forced logout or Firebase account mutations.
- [x] Run all tests and `npm run typecheck`; expect passing. Commit only Task 2 files.

### Task 3: Android validation and documentation

**Files:** Update `docs/firebase-setup.md`, `docs/verification.md`, `README.md` where relevant.

**Interfaces:** Existing live Firebase configuration and Android package `ph.cn360connect.app`; existing demo-project `npm run test:emulator` checks.

- [x] Run `npm test -- --runInBand`, `npm run typecheck` and `npm run test:emulator`; expect all passing. Confirm no verification-email call or emailVerified gate was introduced.
- [x] Build/install the native Android app without clearing its data. Verify Login/Register/reset navigation, password toggles, validation, submission errors, Android Back/keyboard, small-screen scrolling and persistence with the existing emulator integration coverage. Let the user enter live credentials directly if live verification is required; distinguish automated and live results.
- [x] Document Email/Password provider setup, Firebase password policy, no verification requirement and no SMS billing prerequisite for this email flow. Record actual Android device/API and remaining live checks. Preserve phone implementation history as historical evidence.
- [x] Review the diff, run `git diff --check`, and complete the execution workflow's final review before reporting results. Stop before additional application modules.

## Approval and execution

Approved by the user with “proceed”; implemented inline. Native Android and automated verification completed; final independent review is recorded in docs/verification.md.
