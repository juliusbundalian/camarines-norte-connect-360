# Verification record — 2026-11-04

Scope: initial onboarding and Firebase email authentication foundation only. Automated integration tests use `demo-cn360-connect`; subsequent user-authorized live Android checks are recorded below.

## Automated evidence

| Check | Result |
| --- | --- |
| Strict TypeScript (`npm run typecheck`) | Passed |
| Jest + React Native Testing Library | 56 tests passed across 10 suites (closure recheck 2026-11-05) |
| Real application auth service against Auth Emulator | 3 integration tests passed: lifecycle, password-reset action, native persistence adapter restoration |
| `npx expo install --check` | Compatible versions; no updates required |
| `npx expo-doctor` | 20/20 checks passed |
| Production exports, iOS + Android + web | Passed; emulator variable disabled for production bundling |
| Native Xcode Debug simulator build | `BUILD SUCCEEDED` on iPhone 16 Pro Max, iOS 18.5 |

Tests were developed before their corresponding behavior and observed failing before implementation. Additional regressions cover measured safe-area pager width, hiding inactive onboarding content from assistive technology, and same-turn stale auth callbacks during retry.

The integration runner executes the real TypeScript auth service using development-only `tsx`. It verifies account creation, duplicate email rejection, logout, failed/successful login, neutral missing-account reset requests, generated reset-code retrieval, verification/confirmation of the reset action, and login with the changed password. The SDK's React Native persistence adapter is exercised with an AsyncStorage-shaped test store across fresh Firebase app/auth instances. This does not substitute for process-relaunch verification with the device's actual AsyncStorage.

Earlier sections preserve the original verification history. See the closure record at the end for current Android coverage and resolved findings.

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
- [x] Complete Android gesture/software-keyboard/narrow-large-text and sampled splash checks (closure below); physical-device/tablet coverage remains unverified.
- [x] Confirm cloud reset-email delivery, hosted password change, and subsequent Android login (user-confirmed 2026-11-05).
- [x] Confirm intended Firebase Console password policy and enumeration-protection settings (2026-11-05).

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

### Live Auth setup recheck — 2026-11-05

After the user initialized Authentication and Firestore, the public Auth configuration request succeeded (HTTP 200, project number `1028588633761`). An intentionally nonexistent-user password sign-in returned HTTP 400 `INVALID_LOGIN_CREDENTIALS`, replacing the prior `CONFIGURATION_NOT_FOUND` error. This establishes a responding live Auth endpoint, not a successful-user sign-in. No account was created or email sent by these probes.

The Android debug APK installed successfully on the available Pixel 9 / API 35 emulator, and the app was launched with Metro using the live `.env.local` configuration (no emulator URL). Live registration, successful sign-in, session restoration, and reset-email delivery await a user-designated test mailbox and credentials entered directly into the app. Firestore remains configuration-only; no collections, queries, or rule changes were made.

### Live Android account and persistence — 2026-11-05

The user completed registration in the Android app using their designated test mailbox and entered the password directly. The Android screen was observed on Welcome with the matching signed-in email. After `am force-stop` and a fresh launch of `ph.cn360connect.app/.MainActivity`, Welcome and the same account email were observed again. This verifies live authenticated session restoration on the tested Pixel 9 / Android 15 (API 35) emulator using native persistence.

At the user's request, the application's actual `requestPasswordReset` service was executed with live configuration and the designated mailbox. Firebase accepted the request. This check used the shared service from a Node harness; it does not independently verify the Android reset-form interaction. No password or reset token was collected or logged. Inbox delivery, the hosted password change, and signing in on Android with the changed password await the user's confirmation. Firestore data access remains unused.


### User-confirmed live recovery completion — 2026-11-05

The user confirmed that the reset email arrived, the hosted password reset succeeded, and logout/login on Android with the new password succeeded. This is user-confirmed evidence; password entry remained with the user. Live registration/sign-in, native Android session restoration, reset-email delivery, and recovery are now covered by the combined observed and user-confirmed checks.

### Foundation work identified before closure (historical)

- Complete Android-specific UI smoke checks: onboarding swipes/Skip/Back/Next and completion persistence; the Android Forgot Password form itself; protected links and Android back navigation; duplicate/error/offline feedback; software-keyboard usability; narrow/enlarged-text layouts; splash transitions. Automated tests cover much of this logic, but the corresponding Android device checks are not all verified.
- Resolve or explicitly accept the two deferred review minors: consistent 48-point button touch targets and a stronger measured rotation-offset assertion.
- Confirm Firebase Console password policy and email-enumeration protection. Firestore data access remains deferred by scope.
- Choose branch integration (local merge, PR, or preserve the branch). No merge or push has been performed.
- Stop after foundation closure and wait for official Figma designs. Defer iOS testing unless explicitly requested.

## Android foundation closure — 2026-11-05

This section supersedes the outstanding Android/minor-review/Console items in the historical sections above. Android is primary; further iOS testing is deferred.

Target: Diorama_API_35 AVD, Android 15/API 35, ARM64, 1080×2424 at 420 dpi. Native QA used a separately installed `ph.cn360connect.app.qa` debug build and a demo Auth Emulator on port 9098. The temporary generated Gradle application-ID suffix was removed after building. The user's live app, account, and stored session were preserved. No Firestore data access was added.

| Android check | Evidence/result |
| --- | --- |
| Native build | ARM64 Gradle debug APK built successfully and installed |
| Onboarding | Three pages, horizontal swipes, Next/Back, Skip and Get Started exercised; completion survives force-stop/relaunch |
| Authentication | Demo registration, login, logout and native authenticated relaunch passed |
| Route guards | Signed-in `/login` remains Welcome; signed-out `/welcome` remains Login; Back/relaunch cannot restore a protected screen after logout |
| Validation/errors | Required login fields, invalid email, incorrect credentials and connection failure display errors; connection restoration permits retry |
| Password reset | Actual Android form exercised for existing and nonexistent demo accounts; identical neutral confirmation and return to Login |
| Keyboard/password visibility | Android software keyboard observed; registration controls remain reachable; show/hide works |
| Touch targets | Native bounds verified at least 48dp for buttons and password visibility icons |
| Narrow/enlarged text | At 320dp / 200% text, page content scrolls into view and Back/Get Started remain usable; completion passed |
| Rotation | Active second page realigns after native content resize; landscape content and navigation verified |
| Startup | Sampled cold-start screenshots show temporary branded splash; restored signed-in route reaches Welcome. Sampling in a debug build is not frame-by-frame release performance certification |

The two deferred review minors are resolved by a shared token-based Button and an actual post-resize scroll-offset regression. Native inspection additionally found collapsed onboarding content in landscape and a stale horizontal offset after rotation. An outer vertical scroller with a minimum pager viewport and realignment after content-size updates fixes these cases. Layout and content-size regressions were observed failing before the fixes, then passing. The prior width-effect mutation check also failed when its implementation was removed. A fresh independent reviewer found no critical or important issues in the closure changes; actual layout behavior is supported by native checks rather than the structural Jest assertion alone.

Fresh closure checks: 56 Jest/RNTL tests across 10 suites, strict TypeScript, three real-SDK emulator tests, and Android production export passed. Expo Doctor passed 20/20. Existing unit tests cover pending/duplicate-submit behavior and storage failure/retry; a native forced AsyncStorage write failure and native network request counting were not performed. Physical-device and tablet coverage remain unverified. Repeated display/font changes during Fast Refresh produced an Expo linking warning in the debug session; clean process restarts cleared it. Release startup timing and repeated configuration changes in release builds were not certified.

Firebase Console was inspected in the live project. Password policy changed from minimum 6 / Notify to minimum **8 / Require**; maximum remains 4096, no extra character-class requirements were added, and forced password upgrade remains off. SDK `validatePassword` confirmed minimum 8, rejected seven characters and accepted eight. Email enumeration protection was already enabled and was left enabled. Live registration, native session restoration, and user-confirmed email recovery remain documented above.

QA cleanup completed: original display/font/keyboard settings restored, disposable QA package uninstalled, QA Metro/Auth Emulator stopped, and temporary port forwards removed. The live package and its Metro forwarding were preserved.

No merge or push is authorized. Stop at the authenticated placeholder and wait for official Figma designs and approved feature scope.
