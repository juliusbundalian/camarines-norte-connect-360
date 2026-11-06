# Phone Login and Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Execute task-by-task with failing-then-passing tests and one fresh final review.

**Goal:** Implement Figma-based phone entry, SMS verification, error scenarios and native pending-content Terms page, replacing passwords in the public login/signup flow.

**Architecture:** Native Firebase Auth handles SMS/app verification and native sessions. A small platform auth adapter exposes normalized user/confirmation types to existing providers, retaining legacy JavaScript email-session restoration until logout so existing data/accounts are preserved. Shared phone-entry presentation serves Login/Register; one in-memory verification context carries the confirmation handle through OTP and resend, never storing codes or handles. Existing protected navigation remains authoritative.

**Tech Stack:** Expo/TypeScript/Router/Paper/StyleSheet/Expo Image/Expo Font, React Hook Form+Zod, React Native Firebase App/Auth, existing Firebase JS SDK for legacy compatibility/config-only Firestore, Jest/RNTL, Auth Emulator, Android native verification.

**Spec:** `docs/superpowers/specs/2026-11-06-login-registration-findings.md`; user selected phone+SMS authentication and a native Terms page with content to follow. Figma file `Y9XPx697YfMPFKkQzblkqc`, frames `4005:14926`, `4005:15138`, error variants and OTP frames recorded in findings. Login/register high-fidelity contexts/screenshots are cached. OTP MCP reads hit the account's tool quota; inspect OTP directly in Figma desktop and document this fallback rather than inventing missing details.

## Global Constraints

- User waived plan approval for this plan only; execute it now using previously selected Native method. Later plans still require approval.
- Remove password/confirmation/checklist/Forgot Password from the new phone UI. Firebase phone auth uses SMS; do not fabricate phone/password accounts or synthetic emails. Keep legacy email recovery code separate for existing accounts if needed, without presenting it as phone recovery.
- Phone sign-in and signup both verify a phone credential; Firebase creates a new account on first successful verification. Do not probe account existence or manufacture duplicate/account-not-found/wrong-password errors unavailable from this provider.
- Preserve Figma background#F5F5F9, green#39B54A, amber#FFAB00, text/border opacity tokens,16dp spacing,56dp phone input,48dp actions,12–16dp radii and Public Sans Regular/Medium. Reuse local/static assets per cached context; Lucide where already approved/app conventions. Native system bars remain real, no mocked device UI.
- +63 phone entry accepts valid Philippine mobile forms (10-digit9...,09...,63...,+63...), normalizes E.164, rejects other lengths/countries/letters. OTP accepts six ASCII digits, paste/autofill, masks target number only where meaningful, and never logs the code or full phone number.
- Require explicit SMS consent before requesting SMS, with factual Google spam/abuse processing disclosure. Terms page says content pending; no invented terms, no agreement claim, and no acceptance record until actual terms exist. Signup shows an informational pending Terms link rather than accepting empty legal text.
- In-memory verification state survives route transitions, not process death. Missing/stale session returns to phone entry. Resend has a60-second client cooldown, server throttling remains authoritative. Duplicate sends/confirms are synchronously guarded; failed requests preserve usable retry/session state. Changing number/back cancels the pending request generation so late results cannot overwrite a new session.
- React Native Firebase native observation takes precedence; legacy JS sessions remain valid until logout. Wait for both initial observers to avoid flicker. Logout attempts both stores, and failures remain visible. No credential copying, live-user deletion or forced logout.
- Actual project Phone provider is enabled. Read-only SDK check confirmed email/password policy ENFORCE8–4096 plus uppercase/lowercase/number/special; it is unrelated to selected SMS flow and will not be changed.
- Current Firebase Android app is `com.camarinesnorteconnect`, app identity is `ph.cn360connect.app`; preserve existing identity. Native production configuration must match it. Use explicitly demo-only, isolated native configuration for emulator QA; never pretend it is live configuration. Do not alter billing/security/trust settings or send real SMS without required authorization/test number. Document remaining live setup precisely.
- Android first; defer iOS testing. No Home/location/profile/community modules, Firestore collections, custom backend, merge or push. Firestore's existing JS preparation is configuration-only; future native data access must use credentials compatible with native auth.

## Review Focus

1. Expired/wrong codes, network/server failures and quota/app-verification errors retain safe, actionable retries without exposing raw server details.
2. Resend/edit/back/navigation/process death cannot confirm an old number or race a late confirmation into a different flow; automatic native verification routes safely via observer.
3. Legacy signed-in users, mixed observer timing/errors and logout failures cannot cause public/protected flicker or silently erase existing session data.
4. Keyboard, six-digit paste/autofill,320dp/large text, rotation and TalkBack labels keep actions reachable; hidden/disabled controls do not submit.
5. Test-only Firebase config/emulator routing cannot leak into production; real native package/config mismatch fails clearly; Terms pending content is never presented as accepted.

### Task 1: Native phone authentication and verification state

**Files:** Add auth-service types/native implementation and tests; retain/rename JS service as platform fallback; update AuthProvider user/action types, errors, schemas and tests. Add PhoneVerificationProvider/hook/tests, native Firebase dependencies/config plugin, environment setup and demo QA config generator as needed. Update AGENTS scope only for newly authorized auth/Terms work.

**Interfaces:** `AuthUser {uid,email,phoneNumber}`; service `requestPhoneCode(phone, forceResend?): Promise<PhoneConfirmation>` with `confirm(code): Promise<void>`; existing observe/logout remain central. Verification hook exposes phone, intent, ready/sending/verifying/error/resendAt, start/confirm/resend/cancel, with synchronous guards and generation checks. Provider mounted across public auth routes.

- [x] Write failing tests for phone normalization/code validation, native/legacy observer priority/readiness/cleanup/logout, safe provider error mappings, send/confirm/resend guards, stale results, cooldown, missing-session recovery. Run and observe failures.
- [x] Install current compatible stable native Firebase modules and configure Expo plugins. Production config path comes from ignored local google-services.json or explicit environment path. QA generator accepts demo project only and creates a matching isolated application config. No account secrets.
- [x] Implement adapter and provider with no manually persisted credentials. Keep unsupported web phone requests explicit rather than simulating success; retain existing JS service emulator coverage.
- [x] Run focused/full Jest and strict TypeScript; verify SDK integration using Auth Emulator where possible. Commit tested task.

### Task 2: Figma-based phone entry, OTP, Terms and errors

**Files:** Add scoped auth tokens, shared AuthScaffold/PhoneField/AuthAlert, local Public Sans fonts/license and required assets; update LoginScreen/RegisterScreen/WelcomeScreen, public route layout; add verify-phone/terms route wrappers and screens/tests. Update font configuration.

**Interfaces:** Login and Register collect validated phone/SMS consent and start verification, then navigate verify-phone. OTP uses the context's current phone/intent and confirm/resend/cancel. Native observer alone grants authenticated access. Terms is a public read-only pending-content page. Existing welcome shows phone or legacy email.

- [x] Inspect desktop OTP frames after MCP quota failure. Record measured properties/screenshots and deliberate SMS-flow adaptations; do not modify Figma or subscribe/upgrade the user's plan.
- [x] Write failing interaction tests for validation, consent, routing, Terms placeholder, loading/errors, code paste/submit, resend countdown, invalid/expired code retry, missing session, change-number/back and accessibility.
- [x] Implement reusable keyboard-safe layouts/fonts/tokens matching inspected Figma; remove obsolete password UI in this flow. No misleading legal agreement or unsupported account-enumeration scenarios.
- [x] Run relevant/full tests, TypeScript, compatibility/Doctor and Android export; commit tested UI.

### Task 3: Android integration, review and documentation

**Files:** Update Firebase setup/README/verification/plan, safe screenshot evidence and meaningful emulator/native regressions.

- [x] Build/install isolated Android demo package. Use real native Firebase SDK against Auth Emulator, fictional number/codes from emulator endpoints (no real SMS), exercise login/signup/confirm/wrong code/resend/cancel/logout/relaunch/guards; cover expiry handling automatically with live server expiry deferred; distinguish emulator limitations from live Play Integrity/reCAPTCHA testing.
- [x] Compare native login/register/OTP/errors to Figma at412×892, adapt only approved SMS differences; verify keyboard,320dp/enlarged text/rotation, restore device settings and preserve live app/data.
- [x] Run final full Jest/TypeScript/emulator/native/export/Doctor checks appropriate to changes. Obtain one fresh independent review; fix important findings with regression evidence, record precise limitations.
- [x] Finish all implementation before requesting any remaining live Firebase configuration/security approval. Matching Android registration/SHA settings and a user-controlled test number are required for real SMS verification; no billing upgrade or unrelated app deletion.
- [x] Clean only owned QA resources, record completion/setup requirements, commit and stop. No merge/push; future plans require approval.

## Self-review

Phone/SMS selection supersedes password fields/rules/incorrect-password/duplicate-number assumptions in Figma. Pending Terms is explicitly authorized and no legal content is invented. All three tasks share the documented auth/verification interfaces. The only unresolved external live prerequisite is matching Android Firebase registration, not implementation design; emulator configuration permits complete local/native verification first.

## Local implementation closure
All three implementation tasks and the independent review/fix pass are complete locally.102 Jest/RNTL tests, strict TypeScript, native Android build/device checks, Android export, dependency compatibility, Expo Doctor20/20, demo-config tests and legacy SDK emulator tests passed. Live SMS delivery/app verification requires the matching Firebase Android registration/client JSON and signing fingerprints described in docs/firebase-setup.md; Console trust-setting changes remain a required checkpoint. Future plans still require approval.
