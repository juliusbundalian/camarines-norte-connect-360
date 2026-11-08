# Verification record — 2026-11-04

Scope: initial onboarding and Firebase email authentication foundation only. Automated integration tests use `demo-cn360-connect`; subsequent user-authorized live Android checks are recorded below.

## Automated evidence

| Check | Result |
| --- | --- |
| Strict TypeScript (`npm run typecheck`) | Passed |
| Jest + React Native Testing Library | 57 tests passed across 10 suites (Figma onboarding recheck 2026-11-06) |
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

## Supplied splash logo — 2026-11-06

The user supplied `ic_logo.svg` for the splash screen. Its original bytes are preserved in `assets/splash-logo.svg`; `assets/splash-logo.png` is a faithful 1024px transparent raster export for Expo's native splash plugin. The plugin now uses that PNG with the existing centered 160dp image and background. Source rendering used temporary external tooling, adding no application dependency.

Strict TypeScript and Android prebuild passed. Native ARM64 debug build succeeded (1m29s), installed with an in-place update preserving application data, and cold-launch screenshots on the available Android emulator visibly confirmed the new centered logo. No authentication, onboarding, app-icon, or additional module behavior was changed. iOS testing remains deferred.

## Supplied app icon — 2026-11-06

The same supplied logo now drives the standard app icon (`assets/app-icon.png`, opaque 1024×1024 with the existing light background) and Android adaptive foreground (`assets/adaptive-icon.png`, transparent 1024×1024 with padding for launcher masks). Both derive from the preserved SVG; no application dependency was added. The splash asset remains unchanged.

Android prebuild, strict TypeScript, and ARM64 debug build passed (39s). The APK installed as an in-place update, and the Android launcher visibly displayed the new logo without cropping. Application data was preserved. iOS-specific testing remains deferred.

## Figma onboarding implementation — 2026-11-06

The user approved the three supplied CamNorteConnect onboarding frames (`4004:13065`, `4004:13083`, `4004:13101`), then supplied the beach PNG and requested Lucide palm tree, house and users icons instead of the repeated search icon. The image is preserved byte-for-byte. The white curve and three pagination variants are local Figma SVG exports with their original root dimensions. Poppins Regular/Medium and the font license are bundled locally; Expo Font is the only added direct dependency.

Visual implementation uses scoped onboarding tokens: Poppins28/36 headings,16/24 body/actions,32dp content insets, white curved panel, green badge, and amber pagination/actions. Native inspection established that the badge has an8dp **outside** stroke around its64dp green square, so the native outer box is80dp and the Lucide icon box40dp. Text actions preserve54dp visual columns and48dp minimum touch height at default text scale; their width expands with text scaling and actions stack above140%.

Target: Diorama_API_35, Android15/API35, ARM64. Disposable package `ph.cn360connect.app.onboardingqa` used demo-only Firebase configuration and its own local onboarding state; no live account operations were needed. Reference comparison used a temporary1030×2230px viewport at400dpi, exactly412×892dp. All three native screenshots were compared against the individual Figma exports: photo composition, curve, badge, Poppins faces, line wrapping, colors, dots, and action positions. Real Android system bars replace Figma's simulated clock/camera/navigation artwork. The supplied412px photo is resampled on the high-density display. Screenshot overview: `docs/screenshots/figma-onboarding-android.png`.

Native checks passed:

- Forward/reverse swipes on the photo, Next, Android Back to preceding pages, and final Finish.
- Skip and Finish persist completion before routing to the existing Login screen; a fresh process launch stays on Login.
- Rotation on page2 preserves the selected page and its **full visible alignment**. The initial accessibility-only check missed a stale offset; screenshot inspection caught it. The fix remounts the measured-width pager at its preserved initial index. Native landscape heading bounds then confirmed the expected32dp left inset, with no partial neighboring page.
- At130% text, Finish's target expanded from54dp (observed failing width check) to70dp and its label was visibly complete.
- At320×568dp and200% text, all three pages and Finish remained reachable by vertical scrolling; completion reached Login.
- Native pixel/bounds checks caught the initially undersized badge and Paper's default64dp action width, then passed after correction. The final badge green area is64dp and normal action bounds54×48dp.

Verification:57 Jest/RNTL tests across10 suites, strict TypeScript, Expo compatibility check, Expo Doctor20/20, Android production export, and native ARM64 debug build (46s) passed. Updated tests cover Figma copy, Next/Finish, hidden final Skip, reverse paging/Android Back, measured resize/content layout, saving/errors/retry, active-page accessibility, and font loading/failure/retry. Existing provider tests retain duplicate-write and persistence failure coverage.

A fresh independent reviewer found two important issues (rotation alignment and intermediate-scale label clipping), both resolved with failing-then-passing regression evidence and a green full suite. No critical or minor findings were reported. Actual TalkBack traversal and native storage/font failure injection were not performed; those failure paths have automated coverage. Physical-device/tablet and iOS verification remain deferred. A debug-only Expo CLI connection warning appeared during the isolated custom-port session and was dismissed for screenshot checks; no warning-suppression code was added.

Only onboarding presentation/navigation within the existing flow changed. Finish continues to Login; no location permission screen, Home, OTP, profile fields, or other modules were added. Other authentication forms retain temporary layouts. No merge or push was performed.

QA cleanup: original1080×2424/420dpi display, text scale and rotation settings were restored and checked; the disposable onboarding QA package and its8085 forwarding were removed, and the owned QA Metro stopped. The live app and its stored account/session were preserved.

## Figma phone login/signup — 2026-11-06

User selected phone number + SMS code and authorized a native Terms page with content pending. Phone entry follows inspected Figma frames4005:14926/4005:15138 and their error variants: Public Sans, background#F5F5F9, amber#FFAB00, green#39B54A,16dp content spacing,56dp inputs,48dp actions and rounded alert treatment. Password/confirmation/checklist/reset links were replaced by the approved SMS flow. Informational Terms is separate from explicit SMS consent; no unpublished agreement is accepted or stored. No account-existence probe or unavailable duplicate/wrong-password scenario is fabricated.

Figma MCP hit the account quota after login/register/error contexts were read. Desktop inspection established that the five frames named OTP actually contain gender/interests/profile/avatar setup. Those remain out of scope. The necessary SMS code page is a simple functional adaptation of the inspected auth styling; it is not claimed to reproduce a supplied SMS design. No Figma changes or subscription upgrades were made.

React Native Firebase App/Auth27.1.0 provides native phone auth and persistence. Expo58's default Kotlin2.2 failed against Firebase Auth25's Kotlin2.4 metadata; official expo-build-properties58 pins Kotlin2.4.20 (latest supported by the installed Expo compiler artifacts). Native ARM64 debug build then passed in1m23s. Strict project-ID matching prevents a synthetic/native client from silently targeting the live JS project. Emulator routing requires both development mode and a demo- project. The demo-config generator rejects real project IDs and the production package.

Native target: Diorama_API_35, Android15/API35, ARM64; isolated package `ph.cn360connect.app.phoneqa`. Real native Firebase SDK called local Auth Emulator9098, using fictional numbers and local verification codes; no real SMS or cloud account changes. The user's installed `ph.cn360connect.app` and its account data were not cleared/replaced. QA used a separate temporary source copy/Metro8083 because Expo58's development virtual-env reads .env.local even with EXPO_NO_DOTENV shell overrides; the existing live .env.local/Metro8081 were preserved.

Native checks passed:

- Onboarding Skip persistence and phone Login after startup; registration/Terms/back navigation; invalid-number and missing-consent messages.
- Native verification request, incorrect-code response/retry, successful credential confirmation and protected routing. Login verifies existing phone accounts; registration creates a phone account on first verification.
- Native Firebase session restoration after force-stop/relaunch; logout, returning unauthenticated launch and protected deep-link rejection.
- Changing number cancels the verification flow. Process death with an in-memory confirmation returns safely to phone entry. A regression caught changing a signup number being overwritten by a missing-session Login redirect; a leaving guard fixed it RED→GREEN.
- Resend disabled during the60-second cooldown; native resend clears the code field and restarts cooldown.
- Stopping the owned emulator produced a native Firebase internal-error (17499, connection refused). The app showed the safe generic retry message, retained input and successfully retried after server restart. Explicit network-request-failed guidance has unit coverage; no raw server message/host is shown.
- Phone/OTP forms remain scrollable at320×672dp and130% text. Numeric keyboard entry and Verify action were visibly usable; landscape preserves the pending flow and actions remain reachable by scrolling. Emulator stylus handwriting initially hid the regular keyboard; temporarily disabling that input preference established the normal numeric-keyboard check. The font setting was applied before cold-launch layout checks; debug Expo reload warnings during system changes are not claimed as release verification.
- Reference captures at412×892dp use real Android system bars, not Figma's simulated device chrome. See screenshots below. The SMS disclosure/consent/OTP necessarily adapt the supplied password design.

Automated coverage includes Philippine number normalization, six-digit validation, native/legacy observer readiness/precedence/cleanup, stale/cancelled/automatic credential gates, both-store logout attempts, duplicate requests/confirms, resend failure recovery, error mapping, forms/Terms/OTP, protected navigation, and existing onboarding/legacy email regressions. Existing real-JS-SDK email/emulator integration checks (registration/login/reset/persistence) also passed3/3. Final test counts/review are recorded below after closure.

Live SMS remains unverified: the Firebase Console Android app is `com.camarinesnorteconnect`, while the app package is `ph.cn360connect.app`. A matching Android registration/client JSON and signing SHA-1/SHA-256 are required. Live SMS quota/billing, Play Integrity/reCAPTCHA, physical-device delivery/autofill and server code expiration still need live-project/device checks. Expiry, app-verification, quota, disabled-account and network error paths have automated coverage; the emulator does not establish delivery or app-verification behavior. iOS native setup/testing, tablets, full TalkBack traversal, legal Terms content and email-account linking/migration remain deferred and documented. Firestore is configuration-only and its JS instance does not automatically share native Auth's session.

Evidence: [Login](screenshots/phone-login-android.png), [Register](screenshots/phone-register-android.png), [incorrect-code error](screenshots/phone-code-error-android.png), [320dp/130% text with numeric keyboard](screenshots/phone-small-keyboard-android.png).

Independent final review reran101 tests/TypeScript and found one Important issue: native logout could remove the route before a delayed legacy persistence failure reached the screen. An observer-driven regression failed first; logout pending/error now live in AuthProvider, with an application-level pending gate and retry screen. The complete suite then passed102 tests/16 suites plus strict TypeScript. No Critical or Minor findings. No session is restored merely to display a logout error.

After the logout fix, native sign-in/logout and routing passed again with the real Android SDK against Auth Emulator; Android production export passed. QA package was uninstalled, owned Metro8083/Auth Emulator stopped, UIAutomator test artifacts removed, original1080×2424/420dpi/font1.0/rotation/input preferences restored, and the prior generated Android directory restored. Metro8081, local live configuration and live app data remain preserved. Regenerate Android with the matching client JSON before the next live native build.

### Approved live Android configuration

With explicit user approval, registered `ph.cn360connect.app` in `camarines-norte-connect-360` as app `1:1028588633761:android:b26985925f6cca27ed3ae0`, saved and visually verified both documented debug SHA fingerprints, and downloaded the matching Firebase client JSON. `google-services.json` is local/Git-ignored; no service-account credential was used. The existing Android registration, billing plan and SMS region policy were not changed. Console confirmed Phone enabled and a new-project10/day SMS quota.

Live-config native ARM64 Android build passed in2m37s; APK signing digests match the registered certificates. Installed as an update using adb install -r, preserving main-app data. The live-config app reached the phone login screen without startup/configuration errors. No emulator override is present in the live environment. Real SMS entry/verification is now handed to the user directly in the Android app, with no phone number or code requested in chat. Delivery/sign-in and live session-relaunch verification remain pending until that check is completed.

Live-test handoff uncovered an emulator input configuration issue: Diorama_API_35 had hw.keyboard=no and Gboard selected stylus accessory mode. Enabled hw.keyboard=yes in the AVD, restarted without wiping data, verified runtime hw.keyboard=true/qwerty, and disabled stylus handwriting for regular keyboard entry. Phone input is enabled. This changes emulator preferences only; no application validation/auth logic changed. Live SMS result still awaits the user's check.

The first live SMS attempt reached Firebase but was rejected with native status17006: SMS region not enabled. Console showed Phone enabled with an empty Allow region list. After explicit user approval, verified that Allow → Philippines (PH) only is saved and retained after reloading Console settings. No billing upgrade or other-region expansion. The user can retry Send code without rebuilding; real delivery/sign-in still awaits confirmation. No real phone number/code is recorded in this verification document.

After the region policy fix, the native SDK emitted onCodeSent, but the user reported no SMS. Read-only Console inspection found the requested mobile configured under Phone numbers for testing (matched privately; no number or preset code recorded here). Firebase intentionally sends no SMS for a configured testing number. Opened the Phone provider/testing panel and handed removal/save of the preset test credential to the user; actual-SMS retry remains pending. No billing change, bypass or resend was performed.

User removed the preset test-number credential and saved it. Reopened the Phone provider/testing section and verified zero test-number entries, Phone enabled and no pending changes. User prompted to request one real SMS and report the outcome; no code requested in chat and no automated resend performed.

The next handoff uncovered emulator DNS failure: Wi-Fi was associated and direct-IP ping succeeded, but firebase.google.com failed to resolve. Restarted Diorama_API_35 with explicit DNS (8.8.8.8/8.8.4.4), preserving app data, restored keyboard preferences and Metro reverse forwarding, and reopened the app. Verified AndroidWifi connected, Wi-Fi marked VALIDATED, and Firebase hostname resolution/ping successful. No SMS was requested automatically; live delivery/sign-in still awaits the user's retry.

The user's next live request reached Firebase and failed with native status17499 / BILLING_NOT_ENABLED. Real SMS is blocked by project billing, despite the Console's displayed daily quota. No billing change or further SMS request was performed. The native SDK wraps this as auth/internal-error; a failing regression reproduced the generic retry message, and the error mapper now recognizes only the known billing marker and returns safe configuration/support guidance. Other internal errors retain the generic message without exposing backend details. Live delivery/sign-in remains pending owner billing setup.

## Email/password return — 2026-11-08

Approved plan: `docs/superpowers/plans/2026-11-08-email-password-return.md`. Public authentication now uses email/password with the supplied Figma Login reference, previous registration inspection, Public Sans/tokens, password visibility and policy checklist. Figma returned fresh Login context/screenshot; registration context hit the tool limit, so its previously recorded design was reused. SMS entry/consent/OTP UI and its provider are removed; the old OTP route redirects to Login. Terms remains informational/content pending. No verification email or emailVerified gate is implemented. Existing sessions/accounts and onboarding are preserved.

Automated verification: 101 Jest/RNTL tests across14 suites and strict TypeScript passed. Native/legacy observer readiness, protected navigation, unverified-email access, obsolete OTP-link recovery, duplicate submissions, validation/policy/network/credential/existing-account errors, reset confirmation, and cross-route logout failure/retry have coverage. Real Firebase JS SDK/Auth Emulator integration passed3/3 (registration/login/duplicate credentials, hosted reset action, fresh auth-instance persistence). Android production export passed. Native ARM64 live-config build passed (rebuilt48s after regeneration); matching live package installed with adb install -r, preserving data. Isolated demo native build passed51s.

Native testing used Diorama_API_35, Android15/API35 ARM64, disposable `ph.cn360connect.app.phoneqa`, demo project only. Registration reached the placeholder with emailVerified=false; force-stop/relaunch restored the session; wrong password showed a neutral error, correcting it signed in; logout returned to Login. Empty required fields, password visibility, Terms/back, password-reset request/neutral confirmation/Back to Login and obsolete OTP deep-link recovery passed. The native SDK exposed a real compatibility bug: signOut rejects when its store is already empty for an email-only session. A regression failed first, then the adapter was changed to accept only auth/no-current-user as an already-completed native signout; genuine failures still produce recovery. Native logout passed after the fix.

Important test boundary: Firebase Auth Emulator responds HTTP501 NOT_IMPLEMENTED to getPasswordPolicy. Native demo registration used a clearly labeled synthetic policy helper in the disposable /tmp QA copy only; actual account/session/reset operations used the real SDK and Auth Emulator. Production has no policy bypass. A separate read-only call to the live project's real Firebase validatePassword succeeded and confirmed ENFORCE, min8/max4096, uppercase/lowercase/digit/symbol. It created no account and sent no message. The actual live email/password form sign-in/registration/reset has not been submitted automatically; user credentials remain a direct user handoff.

Reference screenshots: [Login](screenshots/email-login-android.png), [Register](screenshots/email-register-android.png), [Reset](screenshots/email-reset-android.png). Real Android system bars are used; no Figma device chrome is drawn. No Home, profile, feature portal, billing change, account deletion/linking, verification email or real SMS request was introduced. iOS/tablets/full TalkBack remain deferred.

Small-device check passed at320×672dp with130% system text: Confirm Password keyboard entry works, the form scrolls, and Register/Log in remain reachable after dismissing the keyboard. [Keyboard/scroll capture](screenshots/email-small-keyboard-android.png). Reference captures use approximately412×892dp. Display size/density/font preferences were restored afterward. Transient UIAutomator null roots/layout changes during system resizing were retried after the screen settled; these are not claimed as release behavior defects.

Independent final review found no Critical/Important issues and independently passed32 focused tests plus git diff --check. One Minor is deferred: the older Sessions paragraph in firebase-setup.md still describes pending phone verification/phone-entry recovery; the new current-flow section correctly records that retired OTP links go to Login.

Decisions retained: fresh registration context was unavailable, so use the previous inspected design (possible future spacing correction); the isolated QA policy fixture cannot prove live enforcement, although read-only live policy lookup succeeded; live account registration/login/reset delivery remains a direct user check; exact registration pixel fidelity is limited by the unavailable fresh reference; iOS/tablets/full TalkBack are deferred (unverified platform/accessibility behavior); phone-account linking/migration and future modules remain excluded (phone-only accounts cannot use public phone sign-in after logout). No accounts or provider settings were changed.

Cleanup complete: disposable QA package uninstalled, owned Metro8083/Auth Emulator stopped, device test artifacts removed, original1080×2424/420dpi/font1.0 restored. Main package/data and Metro8081 preserved. Main app confirmed Email visible, Mobile number absent and no startup error. User invited to test live email credentials directly, without sharing a password in chat.

Live user confirmation (2026-11-08): the user reported successful registration and sign-in in the main Android app against the live Firebase project. This is user-reported live evidence, separate from the automated/demo checks. No password was shared in chat. Live password-reset email delivery and live process-relaunch persistence were not separately confirmed by this reply.
