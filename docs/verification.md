# Verification record — 2026-11-04

Scope: initial onboarding and Firebase email authentication foundation only. Testing uses `demo-cn360-connect`, never a live project.

## Automated evidence

| Check | Result |
| --- | --- |
| Strict TypeScript (`npm run typecheck`) | Passed |
| Jest + React Native Testing Library | 54 tests passed across 9 suites |
| Real application auth service against Auth Emulator | 3 integration tests passed: lifecycle, password-reset action, native persistence adapter restoration |
| `npx expo install --check` | Compatible versions; no updates required |
| `npx expo-doctor` | 20/20 checks passed |
| Production exports, iOS + Android + web | Passed; emulator variable disabled for production bundling |
| Native Xcode Debug simulator build | `BUILD SUCCEEDED` on iPhone 16 Pro Max, iOS 18.5 |

Tests were developed before their corresponding behavior and observed failing before implementation. Additional regressions cover measured safe-area pager width, hiding inactive onboarding content from assistive technology, and same-turn stale auth callbacks during retry.

The integration runner executes the real TypeScript auth service using development-only `tsx`. It verifies account creation, duplicate email rejection, logout, failed/successful login, neutral missing-account reset requests, generated reset-code retrieval, verification/confirmation of the reset action, and login with the changed password. The SDK's React Native persistence adapter is exercised with an AsyncStorage-shaped test store across fresh Firebase app/auth instances. This does not substitute for process-relaunch verification with the device's actual AsyncStorage.

## Native smoke checks and limitations

The locally generated iOS app built, installed, and launched. The first-launch onboarding screen rendered with temporary branding, all three page descriptions were present, and Next/Back updated the selected page. Native Xcode build success was confirmed separately because Expo CLI's post-install window-activation step encountered an OS automation error. Metro started successfully; the app fetched and ran its iOS bundle.

After the user unlocked the Mac, native checks on iPhone 16 Pro Max / iOS 18.5 additionally confirmed:

- Get Started persisted onboarding completion; terminating and relaunching the application returned to Login rather than onboarding.
- The registration form created a disposable local-emulator account and opened Welcome with that account's email.
- Terminating and relaunching the authenticated app restored the same Welcome/email using actual native AsyncStorage persistence.
- Opening the `/login` deep link while authenticated retained Welcome.
- Logout returned to Login.
- An incorrect password displayed the neutral credential error while preserving the login form.
- Onboarding's final-page controls remained exposed while the simulator Text Size setting was raised from 3 to 7; the setting was restored to 3 afterward. This is a limited check on this phone, not exhaustive narrow-screen accessibility certification.

After the second unlock, the remaining native authentication checks also passed:

- Correct credentials successfully retried the earlier failed login and opened Welcome with the expected email.
- Show/Hide Password toggled visibility and the credential still authenticated correctly.
- Forgot Password opened the recovery form; submitting the registered email displayed the neutral confirmation.
- The local emulator's reset-action endpoint confirmed the native form generated a `PASSWORD_RESET` action for the disposable account.
- Back to Login returned from confirmation to Login.
- Opening the `/welcome` deep link while signed out retained Login rather than exposing the authenticated placeholder.

Native swipe attempts through the automation tool did not change pages, so gesture behavior is **not verified** rather than assumed to pass. Software-keyboard visibility was not exercised (the simulator used hardware-keyboard-style input). Remaining device checks include gestures/back gestures, software-keyboard behavior, narrow-screen/accessibility-size rendering, and splash timing/no-flicker. Automated component/router tests cover the corresponding logic, but do not certify these device outcomes.
Android native build, installation, and startup were subsequently checked as recorded below. Android authentication/persistence/gesture interaction checks and tablet interaction checks remain unverified. No cloud Firebase project configuration or mailbox was supplied, so real reset-email delivery and Firebase Console settings have not been verified. The emulator never sends real email.

## Acceptance checklist

- [x] Expo initializes; Metro starts; the iOS app builds and runs.
- [x] Native splash configured with temporary branding and no artificial delay.
- [x] Three onboarding pages and their controls have passing interaction tests.
- [x] Onboarding completion persistence, failed reads/writes, and retry have passing tests.
- [x] Login authenticates against the Firebase Auth Emulator through the actual service.
- [x] Registration creates a Firebase emulator user.
- [x] Forgot Password requests a reset action and the reset code works.
- [x] Firebase React Native persistence adapter restores a fresh auth instance in integration tests.
- [x] Startup route priority, protected links, auth-state changes, and logout pass router tests.
- [x] Loading, errors, duplicate-submit protection, and password visibility pass tests.
- [x] TypeScript, compatibility checks, and relevant automated tests pass.
- [x] Firebase configuration instructions and environment example documented.
- [x] Business logic is separate from temporary presentation for later Figma integration.
- [x] Complete native process-relaunch authentication persistence and onboarding verification on the tested iPhone simulator.
- [x] Complete native Login retry, password visibility, reset confirmation, and signed-in/signed-out protected deep-link checks.
- [ ] Complete gesture/software-keyboard/narrow-large-text/splash checks and other untested device coverage.
- [ ] Confirm cloud reset-email delivery and Console settings in the intended Firebase project.

## Dependencies and review

Latest compatible stable versions were resolved with Expo's installer and locked. The host's initial Node 24.3 was too old for the latest Firebase; verification uses Node 24.22.2 without replacing the system runtime. The project requires Node 24.12+ and provides `.nvmrc` for Node 24.

Firebase's prepared Firestore dependency pinned an older gRPC version with high-severity advisories. A scoped override selects a compatible patched 1.x release (`@grpc/grpc-js ^1.14.7`). After a nonbreaking audit-fix pass, the full dependency tree reports 39 remaining advisories (38 moderate, 1 low), with no high/critical advisories. Do not use `npm audit fix --force`: its suggestions include downgrading Expo/Firebase/tooling to incompatible older major versions. Track upstream compatible fixes; Firestore is not used by any screen.

Whole-change independent review: completed. No authentication, persistence, or access-control defects found. One important temporary-layout issue was fixed: onboarding Back/Get Started now stack vertically so their intrinsic widths cannot overflow together on narrow screens with enlarged text. A rendered layout-contract regression was observed failing before the fix, then passing; limited enlarged-text inspection passed on the tested phone; narrow-screen accessibility rendering remains an outstanding device check.

Two minor findings are deferred for the user: consistently applying the shared 48-point touch-height token to Paper buttons, and strengthening the rotation test to assert the actual post-resize nonanimated scroll offset after an initial measured layout. Existing measured-width regression verifies the Next-button offset, but the separate rotation assertion is weaker.

Decisions retained from review: final Figma fidelity and new modules remain deferred (cost: presentation/feature work waits for supplied designs); actual iPhone onboarding/auth process restoration is now verified, while the remaining gesture/keyboard/narrow-large-text/splash behavior and Android/tablet parity remain unverified (cost: outstanding confidence outside the tested native cases); cloud email delivery/Console settings remain unverified (cost: live-project readiness is pending); Firestore authorization/data behavior remains deferred until there is approved data access (cost: future features still need rules/data verification). The development-only tsx runner is retained to execute the actual service (cost: one small development dependency). Remaining native/live checks above must stay explicit at handover; this record does not claim all device acceptance checks passed.

## Updated platform priority

The user confirmed Android as the primary target on 2026-11-04. Future development and testing must prioritize Android; iOS-specific testing is deferred unless requested. The earlier iOS smoke checks do not establish Android readiness. This guidance is recorded in `AGENTS.md` for future sessions.


### Initial native Android evidence

- Target: Pixel 9 AVD, Android 15 / API 35, ARM64, Java 21.
- Expo Android prebuild succeeded. Gradle `:app:assembleDebug` succeeded; the all-architecture first build took 8m43s.
- The existing emulator rejected installation with `INSTALL_FAILED_INSUFFICIENT_STORAGE`; no existing apps or data were deleted. An isolated temporary writable-image directory was used for a successful installation.
- A smaller `:app:assembleDebug -PreactNativeArchitectures=arm64-v8a` build succeeded in 9s using the existing build cache.
- Installation and launching `ph.cn360connect.app/.MainActivity` succeeded. Metro served the Android bundle; the first onboarding page rendered with branding, Skip, pagination, and Next. Screenshot: `docs/screenshots/android-startup.png`.
- The initial debug launch could not find Metro on the earlier custom port; starting Metro on its default 8081 and forwarding `adb reverse tcp:8081 tcp:8081` resolved it. The local Auth Emulator used `adb reverse tcp:9098 tcp:9098`.
- This confirms native build/install/startup only. Android registration, login, reset confirmation, logout, relaunch persistence, protected navigation, gestures, keyboard handling, and splash timing still require Android emulator/device interaction checks. They are now the testing priority; iOS testing is deferred.

## Live Firebase configuration — 2026-11-05

The user supplied the public web client configuration for `camarines-norte-connect-360`. It was saved to the ignored `.env.local`; the Auth Emulator URL was removed. Production-mode environment parsing passed and confirmed emulator mode is disabled. Analytics was not added; the supplied measurement ID is outside the approved scope. Emulator tooling remains tied to its safe demo project.

A public Auth project-configuration request and an intentionally invalid, nonexistent-user password sign-in probe both returned HTTP 400 `CONFIGURATION_NOT_FOUND`. No account was created and no email was sent. This is consistent with Authentication not yet being initialized in the Firebase Console; the user must initialize Authentication and enable Email/Password before live authentication can be verified. Live Android authentication testing is pending that project setup. No live authentication success is claimed.
