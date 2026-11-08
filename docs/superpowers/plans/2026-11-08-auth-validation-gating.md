# Authentication Validation Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Disable Login, Register and Send Reset Link until their current inputs meet the applicable validation requirements.

**Architecture:** Keep React Hook Form/Zod as the field-validation authority and the existing guarded Firebase actions as the submission boundary. Extract the registration checklist's existing policy evaluation into a pure shared helper so its indicators and button gate cannot disagree. Fetch Firebase's policy on registration entry, expose loading/error/retry states, evaluate keystrokes locally, and keep the existing Firebase validatePassword check at submission.

**Tech Stack:** Existing Expo/React Native, TypeScript, React Hook Form, Zod, Firebase JS SDK, Paper, Jest/RNTL. No new dependencies or global store.

**Spec:** User request dated 2026-11-08 and the bounded description below. Preserve the approved Figma styling and existing email/password authentication; do not add email verification.

## Description for approval

| Primary action | Enabled only when |
| --- | --- |
| Login | Trimmed email passes the existing email schema; password is nonempty; no submission is pending. |
| Register | Email passes the schema; password meets the existing app minimum of 8 characters and all loaded Firebase policy requirements; confirmation exactly matches; no submission is pending. |
| Send Reset Link | Trimmed email passes the existing email schema; no submission is pending. |

All three primary buttons start disabled. Editing a valid form back to invalid disables the action immediately. Login must continue to accept existing short passwords and must not depend on registration-policy loading. Passwords are never trimmed or changed. Email trimming continues to happen through the existing schema/service.

Registration remains disabled until the policy loads. Display a short loading status; if lookup fails, show safe recovery guidance and a separate **Retry password requirements** control that stays usable while Register is disabled. Successful retry restores normal validation. Do not substitute a permissive default policy in production. Preserve Back/Login/Terms navigation and password visibility while fields are invalid or requirements are loading; only pending account submissions retain the current navigation lock.

Keep the current layout/tokens. As explicitly requested at approval, disabled primary buttons retain their existing colors at exactly 40% opacity; do not use Paper's default gray disabled fill. Update validity on change; show field errors after blur/touch (or a keyboard submission attempt), then clear/update them as the user corrects the value. The password checklist remains live. Disabled styling alone is insufficient: keyboard Done and handler calls must still validate current inputs, policy readiness and pending state before any authentication request. Server/network/credential failures must retain form values and allow retry once inputs remain valid. Firebase remains authoritative; a server policy rejection refreshes the displayed requirements through the existing validatePassword boundary.

## Global Constraints

- Android is primary; native Android build and emulator checks are required. Defer iOS testing.
- No email verification, SMS, account migration, billing or Firebase Console policy changes.
- No Home, profile, tourism, real-estate or community modules.
- Preserve existing accounts, sessions, onboarding, password recovery and Figma styling.
- Never clear live app data or log passwords. Use disposable demo accounts for automation.
- Auth Emulator does not implement getPasswordPolicy; any native QA policy fixture must remain confined to a disposable QA copy and be disclosed.
- Planning only until user approval; retain native/inline execution for implementation.

## Review Focus

- Valid → invalid edits must immediately disable the button, including confirmation becoming stale when the password changes (Task 2).
- Policy-load failure must leave a usable retry path without allowing registration under unknown requirements (Tasks 1–2).
- Keyboard/autofill/rapid presses must not bypass validation or duplicate requests (Task 2).
- Existing short-password Login must remain available without registration-policy lookup (Task 2).
- Offline/server errors must preserve values and recoverable action state (Tasks 1–2).

### Task 1: Shared password requirements and policy readiness

**Files:** Create `features/auth/password-requirements.ts` and `features/auth/__tests__/password-requirements.test.ts`; modify `features/auth/PasswordRequirements.tsx`, `EmailEntryScreen.tsx` and `features/auth/__tests__/auth-screens.test.tsx`. Reuse `services/firebase/password-policy.ts` and the existing error mapper.

**Interfaces:** `getPasswordRequirements(policy: PasswordPolicy, password: string): readonly { key: string; label: string; met: boolean }[]` supplies both checklist rendering and `every(rule => rule.met)` gating. Registration policy state explicitly distinguishes loading, available and failed; the existing SDK helper remains `checkPasswordPolicy(password: string): Promise<PasswordValidationStatus>`.

- [x] Write helper tests for minimum length, maximum length, each enabled character requirement, Firebase's allowed symbol set, disabled optional requirements and the app's minimum8 floor. Expected criteria must be literal, independent of the implementation. Add RNTL tests proving policy failure is displayed, Retry succeeds, a late older result cannot replace newer state, and unmounting does not update abandoned state.
- [x] Run `npm test -- --runInBand features/auth/__tests__/password-requirements.test.ts features/auth/__tests__/auth-screens.test.tsx`; expect failures for the missing shared helper and missing policy recovery behavior.
- [x] Extract the existing checklist evaluation into the helper and consume it from PasswordRequirements. Add explicit initial-policy loading/error/retry state in EmailEntryScreen; ignore stale/unmounted results and duplicate retry presses. Retain successful submission's latest policy update.
- [x] Run the focused suites; expect passing. Commit Task 1 files.

### Task 2: Gate the three primary actions and preserve feedback/recovery

**Files:** Modify `features/auth/EmailEntryScreen.tsx`, `ForgotPasswordScreen.tsx`, `AuthScaffold.tsx`, `theme/auth.ts`, and `PasswordRequirements.tsx` if its loading copy needs adjustment; update `features/auth/__tests__/auth-screens.test.tsx`. Reuse `AuthAction.disabled`, schemas, AuthInput, existing async-action guard and shared requirements from Task 1.

**Interfaces:** Existing `useAuth().login(email,password)`, `.register(email,password)`, `.requestPasswordReset(email)` remain unchanged. React Hook Form subscribes to on-change validity, touched fields and current values; action.pending remains the submission lock. No authentication-context or router contract changes.

- [x] Replace tests that submit empty forms by pressing enabled actions: assert all primary actions start disabled at opacity0.4 with original colors; blur invalid fields and assert helpful errors; fill valid values and assert enabled. Run tests and confirm intended failures against current gating behavior.
- [x] Add cases for Login with a valid email and existing short password; malformed/whitespace-only email; clearing a valid password; signup mismatch and confirmation becoming invalid after a password edit; each loaded Firebase requirement blocking Register; requirements loading/failure/retry; reset valid → invalid edits; pending/error recovery. Assert invalid button presses and keyboard submission invoke no auth actions. Run the focused screen suite again and confirm these new gating tests fail before implementation.
- [x] Configure on-change form validation and touched/submission feedback. Pass disabled conditions to AuthAction. Register additionally requires available policy and every shared requirement met. Add equivalent guards at the handler boundary; retain the authoritative SDK policy recheck, current duplicate-submit guard and safe server errors. Do not trim passwords or disable navigation merely because inputs are invalid.
- [x] Run `npm test -- --runInBand` and `npm run typecheck`; expect all passing. Confirm existing session/navigation/reset regressions still pass. Commit Task 2 files.

### Task 3: Native Android verification and final review

**Files:** Update `docs/verification.md`; update `docs/firebase-setup.md` only if recovery/setup instructions change.

**Interfaces:** Existing Android package `ph.cn360connect.app` and isolated demo QA configuration. Preserve live data and credentials.

- [x] Build/install the native Android app without clearing its data. Check initial disabled state, valid/invalid transitions, keyboard Done/autofill, password visibility, policy retry, pending/retry behavior and small-screen scrolling on Android15/API35 (or record the actual available device).
- [x] Use a disposable QA copy and documented fixture for native policy-loading/failure scenarios, since Auth Emulator lacks that endpoint; actual account actions use Auth Emulator. Do not weaken production checks, change live network/configuration permanently or create live accounts automatically.
- [x] Run full Jest/RNTL and strict TypeScript checks; run the real SDK Auth Emulator integration when service/integration behavior changes. Record commands, native results and any unverified live behavior. Inspect the changed screens against the existing Figma styling without expanding design scope.
- [x] Run `git diff --check` and the executing-plans workflow's single independent final review; address blocking findings through regression tests. Commit verification documentation. Stop before further application features.

## Plan review

Self-review: all three forms have a defined gate and recovery behavior; checklist and button validity share one evaluator; handler guards cover alternate submission paths; existing authentication/navigation contracts remain unchanged; each review-focus item maps to tests above. Approved with “proceed”; user specified 40% opacity for disabled primary buttons. Native/inline execution retained.
