# CamNorte 360 — Codex handoff

Recorded 2026-11-08, Asia/Manila. This file describes the current implementation, not an instruction to expand scope.

## Current Menu/navigation implementation — 2026-11-08

The approved Menu/navigation plan is being executed on `codex/main-navigation-menu`; branding6ee4b75 is already merged/pushed to main. Main Menu implementation and Android QA/review are complete. Final174 tests/18 suites, TypeScript, policy2/2 and real SDK emulator3/3 passed. Native production build45s and isolated QA23s passed on Android15/API35 Diorama_API_35. An independent review found one Important error-precedence issue, reproduced RED then fixed; see verification docs for three deferred Minors (missing-marker logout onboarding, cold Login Back default Home, and narrow guest Login target). Do not restart completed implementation tasks. Home is now the default placeholder after onboarding and for returning guests/users. The five-tab shell is guest-accessible; auth belongs at future protected actions, not at app entry. Guest and signed-in Menu match Authentication Flow frames4005:13901 and4005:14053, using Poppins and a generic identity/avatar until profile data is separately implemented. Guest Login/Sign up are independent; Logout appears only when signed in. Wishlist/Account/Notifications/Privacy are public, honest placeholders; Terms stays pending and is now a root route available in both states. /welcome redirects to /home.

Auth returnTo is strictly allowlisted. Existing auth/reset links carry it, cold Login Back returns to the safe source, and a centralized auth layout redirects observed signed-in users. Freeze the validated redirect target during route replacement: Expo58 can replace parameters before its pathname/focus updates. Logout progress/error uses a blocking, accessibility-isolated overlay above a retained navigator; unmounting it resets Menu to Home. Preserve the corresponding router regressions.

No bookings, data modules, private profile data, saved-item storage or notification permission/settings changes were added. Production Firebase policy helpers have no QA bypass. Native demo QA may use the synthetic policy fixture only in its isolated temporary copy because Auth Emulator has no getPasswordPolicy endpoint. User approved inline execution and commits; do not merge/push this feature until separately requested.

## Current branding and geographic scope — 2026-11-08

The official display name is CamNorte 360. Geographic coverage is exclusively Daet, Camarines Norte, Philippines. This overrides older province-wide wording and visual reference copy. Onboarding now describes Daet tourism, property opportunities and community updates. Do not include other municipalities without explicit request. Existing package identifiers, Firebase configuration, Expo slug, URL scheme and storage keys are unchanged. Existing approved phase and Figma requirements still apply; no new modules are authorized. The foundation was committed, fast-forward merged to main and pushed at b9987b8 before this branding update; branding6ee4b75 was subsequently merged/pushed to main. Current navigation work uses `codex/main-navigation-menu` in the preserved worktree; use git status for current changes.

## Latest continuation update — 2026-11-08

This update supersedes older current-behavior and next-task statements below. The user authorized committing all completed work, merging to main and pushing origin/main. Confirm integration state with Git rather than relying on the older unmerged status. Preserve this worktree and ignored Firebase/native configuration.

Latest auth refinements: all forms use form-level alerts after a submission attempt, with no inline validation messages or red validation borders. Password validation and disabled-action gates remain active. The registration checklist hides maximum length only in presentation, retains its validation, and includes a Password Requirements heading. A required, initially unchecked Terms checkbox is validated by both the registration gate and submit boundary. Its independent inline green Terms link and compact checkbox match the Figma agreement row; prefix text uses secondary color and Public Sans Medium14/20. Terms legal content remains pending; checkbox state is not a persisted legal acceptance record. No email verification or public SMS flow.

Latest verification before integration:140 Jest/RNTL tests, TypeScript, and two installed-SDK password-policy tests passed. Native ARM64 build and Android15/API35 Diorama_API_35 checkbox/link/rendering checks passed during this session. Actual Terms content, full TalkBack/autofill and remaining live reset-delivery checks are still pending. Future modules require supplied designs and explicit scope; the user's intention to move on does not authorize inventing those modules.

## Workspace and workflow

Worktree: `/Users/juliusjervinbundalian/.codex/worktrees/auth-foundation/camarines-norte-connect-360`.
Main checkout: `/Users/juliusjervinbundalian/Documents/GitHub/camarines-norte-connect-360`.
Branch: `codex/auth-foundation`; implementation HEAD before this handoff: `da58cbb`. Main is still `8a9bbd8`. Nothing merged or pushed. Working tree was clean before creating this file. Preserve this linked worktree; do not create another unnecessarily or overwrite main.

Read `AGENTS.md`, `README.md`, `docs/firebase-setup.md` and the newest sections of `docs/verification.md`. Historical sections describe superseded phone authentication: current public authentication is EMAIL/PASSWORD.

Use installed Superpowers skills and their actual instructions. User selected native/inline execution. Future implementation plans require approval; earlier approval waivers were for specific completed tasks only. Android is primary for all development/testing; defer iOS. The latest approved validation plan is complete. No new implementation is currently authorized beyond the completed scope. Do not restart completed tasks. Plan-specific scratch was removed after completion; older sibling scratch may exist and must not be deleted indiscriminately.

## Original goal and strict scope

Build a clean Expo/React Native TypeScript foundation for a local real-estate, tourism and community application for Daet, Camarines Norte, Philippines only. Initial scope: splash, three-page onboarding, email/password login, registration, password recovery, persistent sessions, centralized authentication and protected navigation, and a minimal authenticated placeholder. Official screens come from Figma. STOP before Home, tabs, tourism, real estate, community, profile or other modules without supplied designs and explicit approval.

## Completed work and pivots

1. Initialized Expo Router/strict TypeScript, React Native Paper, StyleSheet/tokens, Expo Image, Lucide icons, React Hook Form/Zod, Firebase JS SDK, AsyncStorage, splash management and Jest/RNTL. No unnecessary global store/custom backend.
2. Implemented startup readiness without artificial delays/flicker, onboarding persistence, observed auth, recovery/error states, protected/public navigation and logout.
3. Applied user's `ic_logo.svg` to splash and app icons. Source was `/Users/juliusjervinbundalian/Downloads/ic_logo.svg`; repository assets are authoritative now.
4. Implemented Figma onboarding with supplied beach image (`/Users/juliusjervinbundalian/Downloads/image 90.png`), swipe/Next/Back/Skip/Get Started, pagination and persistence. Lucide palm tree, house and users were explicitly requested/approved.
5. Implemented Figma auth styling, briefly changed public auth to native Firebase phone/SMS at user request, configured matching Android Firebase registration, and tested isolated native SMS flows. Live SMS ultimately failed with BILLING_NOT_ENABLED; no billing upgrade was performed.
6. User then explicitly requested returning to email/password using the same Figma UI and NO EMAIL VERIFICATION. Completed this return, removed public SMS screens/provider, kept existing native session compatibility, restored recovery, and retained informational native Terms page with content pending. User confirmed successful LIVE registration and sign-in afterward.
7. Latest completed task: all Login/Register/Send Reset Link primary actions start disabled and enable only when valid; disabled appearance is exactly opacity0.4 with the same amber/text colors. Recovered policy loading errors, synchronized checklist/gate logic, prevented keyboard/duplicate bypasses, and fixed two independent-review findings. No extra modules were added.

## Current behavior

First launch: splash → onboarding → Login/Register → authenticated placeholder. Returning unauthenticated: splash → Login. Returning authenticated: splash → placeholder. Authenticated state takes precedence over onboarding. Initial auth and onboarding restoration settle before routing. Errors offer recovery.

Login requires valid trimmed email and a NONEMPTY password. It intentionally accepts existing short passwords; do not impose registration complexity on Login. Passwords are never trimmed.

Registration requires valid email, app minimum8 characters, all current Firebase policy rules, and exact confirmation. Policy metadata is loaded before Register can enable. Failed lookup blocks Register and exposes independent Retry password requirements. Navigation/visibility remain usable while invalid or loading, but pending submissions retain existing locks. Checklist and gate use the same pure evaluator. Errors appear after touch/blur or keyboard submission and correct as input changes. Changing Password explicitly revalidates touched confirmation.

Submit handlers revalidate current values independently of disabled visuals. The SDK rechecks password policy before registration. Server policy rejection triggers requirement reload. SDK creation signs the account in; no sendEmailVerification call, verification screen, polling or emailVerified gate exists.

Forgot Password requires a valid email, calls Firebase sendPasswordResetEmail, presents account-neutral confirmation, and uses Firebase's hosted reset action. Password-reset email is still supported; omitting email verification does not remove account recovery.

The placeholder contains app name/welcome, email (phone fallback for retained sessions), logout, and the message that the main app awaits Figma. Terms contains approved-content-pending copy only; no fabricated legal terms or acceptance claim.

## Architecture and important decisions

- Thin routes under `app/`; auth feature under `features/auth/`; onboarding in `features/onboarding/`; Firebase adapters/config under `services/firebase/`; centralized theme/tokens.
- `AuthProvider` observes the native and JS stores, waits for both, prefers a native identity if present, and retains legacy sessions. Root navigation uses Expo Router protected groups. Logout pending/error state lives above routes so failures survive observer-driven screen removal; retry attempts both stores.
- Public email operations use Firebase JS SDK with supported React Native AsyncStorage persistence. Passwords/OTP credentials are never manually persisted. AsyncStorage persistence is not encrypted keychain storage.
- React Native Firebase App/Auth remains for existing native session compatibility. Native logout's auth/no-current-user is treated as already signed out, because email-only sessions live in JS. Other failures remain actionable.
- Public phone entry/consent/OTP and their provider were deleted. `/verify-phone` now safely redirects to Login. Phone accounts were not deleted/migrated/linked; after logout there is no public phone login. Linking needs a separately approved flow.
- Firestore is lazy configuration only. No collections/Storage integration. Native and JS Auth do not share sessions automatically; future data features must use a compatible SDK/explicit bridge.
- `usePasswordPolicy` isolates loading/retry/generation guards (one extra hook maintained). `getPasswordRequirements` provides checklist and gate criteria.
- Firebase's validatePassword caches requirements per Auth instance; server rejection refreshes that cache asynchronously. Immediate retry on the same instance can read stale policy. The final helper creates a temporary named Firebase JS app/Auth with inMemoryPersistence, same public app options/tenant/emulator configuration, validates against a fresh policy, then deletes it in finally. It never signs in or changes the active session and uses no private SDK methods or artificial waits. Tradeoff: an uncached policy read/initialization per check. Do not replace it with a same-instance immediate retry without preserving the cache-race regression.
- `AuthAction` keeps real disabled semantics and applies opacity0.4 to the rendered Paper Surface outer layer, overriding Paper's gray disabled fill and label colors. Enabled opacity1. Tokens are centralized.
- Onboarding uses Poppins; auth uses local Public Sans Regular/Medium and its own inspected tokens. Figma reference412×892, auth background#F5F5F9, amber#FFAB00, green#39B54A. Real Android system bars replace drawn Figma device chrome.
- Expo build-properties pins Kotlin2.4.20 because it is compatible with Firebase Auth25 and installed Expo compiler artifacts; prior default2.2 metadata failed and2.4.21 compiler artifacts were unavailable. Do not casually remove the pin.

## Files changed

Full authoritative inventory of all foundation changes versus main:
`git diff --name-status 8a9bbd8..HEAD`

Latest validation task modified/created:
- `features/auth/EmailEntryScreen.tsx`: field validity, handler checks, policy recovery, dependent confirmation revalidation.
- `features/auth/ForgotPasswordScreen.tsx`: email gate and touched feedback.
- `features/auth/AuthScaffold.tsx`, `theme/auth.ts`: primary disabled semantics/color/opacity.
- `features/auth/PasswordRequirements.tsx`, new `password-requirements.ts`, new `usePasswordPolicy.ts`.
- `services/firebase/password-policy.ts`: fresh in-memory policy probes and cleanup.
- `features/auth/__tests__/auth-screens.test.tsx`, new `password-requirements.test.ts`, new `usePasswordPolicy.test.tsx`.
- New `scripts/password-policy.test.mjs`, `package.json` test:policy script, README, setup/verification docs, latest plan and four auth-validation screenshots.

Earlier key files: `app.config.ts`, `app/_layout.tsx`, `app/index.tsx`, `app/onboarding.tsx`, auth/app route groups, Login/Register/ForgotPassword/Terms/Welcome wrappers, AuthProvider/AuthInput/schemas/errors/useAsyncAction, onboarding screens/provider/content/assets, Firebase config/client platform adapters/auth services/types, .env.example, .gitignore, emulator configuration, Jest setup, branding/fonts/icons and integration tests. Review the git inventory rather than assuming this list is exhaustive.

Important history: `85ba9ab` email forms, `8bb9f4f` public SMS retirement, `bfe6ab6` email-only logout fix, `7d7062a` user live success, `1f6e9d3` shared policy/readiness, `1522bdc` validation/opacity, `4f69297` Android verification, `da58cbb` final confirmation/cache fixes.

## Firebase and local configuration

Project `camarines-norte-connect-360`, project number1028588633761. Android package `ph.cn360connect.app`, matching Firebase Android app ID `1:1028588633761:android:b26985925f6cca27ed3ae0`. User explicitly approved registering it and debug fingerprints. Older `com.camarinesnorteconnect` registration remains separate. `.env.local` and root `google-services.json` are local/Git-ignored; do not print or commit them or service-account secrets. Native builds still require the JSON due retained native adapter.

Debug SHA1 `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`.
SHA256 `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`.

Email/Password enabled; live read-only policy checks confirmed ENFORCE,min8,max4096,uppercase/lowercase/digit/symbol. No verification requirement. Native phone provider remained enabled; PH-only SMS allowlist was explicitly approved. User removed their preset testing-number credential; list verified empty. Real SMS then returned BILLING_NOT_ENABLED. Billing was never changed; email/password does not require the SMS billing upgrade. Do not restart SMS work or change billing.

Auth Emulator project is `demo-cn360-connect`; auth9098, UI4001, hub4402, logging4502. Android uses10.0.2.2:9098. Never direct automated tests at live accounts. The emulator DOES NOT implement getPasswordPolicy (HTTP501). Native QA used a clearly marked synthetic policy fixture only in `/tmp/cn360-email-project`; production helper has no bypass. Copying that fixture into the real workspace would be a serious regression.

## Verification completed

Latest full Jest/RNTL:133 tests across16 suites PASS. Strict TypeScript PASS. `npm run test:policy`:2/2 PASS with actual installed Firebase SDK and all HTTP intercepted before SDK import; reproduces delayed-cache race and verifies temporary-app cleanup on error. No real network is allowed by this test. `npm run test:emulator`:3/3 PASS for actual JS SDK account/login/reset/persistence.

Native Android15/API35 ARM64 AVD Diorama_API_35: live-config native build4s, isolated QA24s; installed with adb install -r without clearing live app data. Android production exports passed before/after review fixes. Native tests passed for invalid/valid/cleared Login, short-password acceptance, requirement failure/retry, confirmation matching, demo registration/logout, reset gates/request/confirmation, invalid keyboard Done, visibility/navigation, and320dp/130% text keyboard/scrolling. After review fixes, dependent confirmation feedback was retested natively. Production Android also loaded the live policy via the new helper without submitting credentials. Previous user explicitly confirmed successful live email registration/sign-in.

Independent review passed original131 tests/TS, found two Important issues (stale dependent feedback and SDK policy-cache race), both reproduced RED→GREEN and fixed in one pass. Final133 tests plus SDK/cache tests and emulator suite passed. No Critical findings or deferred Minor findings from latest review. No second review was dispatched per execution workflow.

Cleanup: disposable QA package `ph.cn360connect.app.phoneqa` uninstalled, owned Metro8083/Auth Emulator stopped, device test XML removed, display1080×2424/density420/font1.0 restored. Main package/data and pre-existing Metro8081 preserved. Main app reopened. Temporary test directories may remain under /tmp; they are not authoritative source.

## Unresolved issues and explicit limits

No known blocking validation/authentication defect remains after the fixes. Live password-reset delivery and live relaunch persistence were not newly confirmed by user; SDK/emulator/native demo coverage exists. Credential-manager autofill and full TalkBack traversal were not exercised. iOS/tablets remain deferred. Exact registration pixel fidelity was not asserted against fresh Figma context due tool quota; existing recorded design/tokens/screenshots were used. Possible future visual correction remains.

Terms legal content is pending. Phone-only account migration/linking and future authenticated data SDK choice are deferred. A historical paragraph in docs/firebase-setup.md still describes old phone verification recovery; earlier review noted this non-blocking documentation inconsistency, while its current-flow section correctly documents Login redirect. Do not interpret historical phone docs as current requirements.

Figma file `Y9XPx697YfMPFKkQzblkqc`, CamNorteConnect page4004:12526. Login4005:14926; Register4005:15138; findings in docs/superpowers/specs/2026-11-06-login-registration-findings.md. Figma OTP-named frames inspected previously were profile/gender/interests/avatar screens, OUT OF SCOPE. MCP Starter limit blocked fresh registration context; do not upgrade user plan automatically.

## Exact next task

The approved Menu/navigation plan is complete and committed on `codex/main-navigation-menu`, with no feature merge/push. Read its execution-closure section and the newest verification record for results and the three deferred Minors. Branding is already on main at6ee4b75. The next action is user review, a requested follow-up on the documented Minors, or a new explicitly approved feature/Figma scope. Do not silently implement real Home/content, profile, booking, wishlist storage or notifications. Preserve this worktree and local config.

## Exact next-session commands

Run these initial read-only checks first:

```sh
cd /Users/juliusjervinbundalian/.codex/worktrees/auth-foundation/camarines-norte-connect-360
pwd
git status --short
git branch --show-current
git log -8 --oneline
cat AGENTS.md
cat CODEX_HANDOFF.md
```

For a fresh verification baseline before new code, use Node24.12+ (host default Node can be too old). Existing local Node24.22.2 installation:

```sh
export PATH=/Users/juliusjervinbundalian/.npm/_npx/387698761821791d/node_modules/node/bin:$PATH
export JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home'
export ANDROID_HOME=/Users/juliusjervinbundalian/Library/Android/sdk
node --version
npm run typecheck
npm test -- --runInBand
npm run test:policy
npm run test:emulator
git diff --check
```

If that cached Node binary no longer exists, use the project's `.nvmrc`/installed Node24; do not downgrade dependencies to accommodate the host default. Do not reinstall dependencies unnecessarily when node_modules already works. Check9098 is not occupied by another owned emulator before test:emulator; do not kill unrelated servers.

Only when a new approved task needs a native run:

```sh
lsof -nP -iTCP:8081 -sTCP:LISTEN
$ANDROID_HOME/platform-tools/adb devices
cd android
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a -PreactNativeDevServerPort=8081
cd ..
$ANDROID_HOME/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
$ANDROID_HOME/platform-tools/adb reverse tcp:8081 tcp:8081
$ANDROID_HOME/platform-tools/adb shell am start -n ph.cn360connect.app/.MainActivity
```

Reuse the existing Metro8081 if healthy; do not start competing servers. If absent, run `npm start -- --port 8081` from this worktree. Run prebuild only if native configuration changes; it can clear generated Android output. Export alone does not prove native behavior.

If the emulator is stopped and DNS fails despite AndroidWifi association, the verified workaround was:

```sh
$ANDROID_HOME/emulator/emulator -avd Diorama_API_35 -no-snapshot-save -dns-server 8.8.8.8,8.8.4.4
```

Do not launch a second instance of the same AVD. User approved ADB/UIAutomator taps/swipes/keyboard/back and temporary test display/network changes, preserving live app/account data. Computer-use tools could not attach to Android, so ADB is the approved fallback. Never pm clear/uninstall the main package. Keep real passwords/codes out of chat/logs. Raw FirebaseAuth logs can expose phone numbers; sanitize before output. On this AVD, hw.keyboard=yes and secure stylus_handwriting_enabled=0 plus show_ime_with_hard_keyboard=1 were needed for normal typing; retain the usable configuration. Android Done can already dismiss the keyboard, so do not send an extra Back blindly. `adb shell input text ''` is invalid; clear with key events without that empty command.
