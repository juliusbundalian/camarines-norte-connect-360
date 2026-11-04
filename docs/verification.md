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

The Mac locked while continuing simulator interaction checks. The user has been asked to unlock it. The following native checks are **not yet verified**: swipe gestures, the complete forms/authentication flow against the emulator, persisted onboarding after process relaunch, authenticated process-relaunch restoration, full back/deep-link behavior, keyboard/large-text behavior, and splash timing/no-flicker. These behaviors have automated component, router, service, or adapter coverage where applicable, but those tests are not device checks.

No Android device/emulator interaction check or tablet interaction check has been completed. No cloud Firebase project configuration or mailbox was supplied, so real reset-email delivery and Firebase Console settings have not been verified. The emulator never sends real email.

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
- [ ] Complete native process-relaunch authentication persistence and onboarding verification.
- [ ] Complete native auth/gesture/keyboard/deep-link/splash smoke checks after the Mac is unlocked.
- [ ] Confirm cloud reset-email delivery and Console settings in the intended Firebase project.

## Dependencies and review

Latest compatible stable versions were resolved with Expo's installer and locked. The host's initial Node 24.3 was too old for the latest Firebase; verification uses Node 24.22.2 without replacing the system runtime. The project requires Node 24.12+ and provides `.nvmrc` for Node 24.

Firebase's prepared Firestore dependency pinned an older gRPC version with high-severity advisories. A scoped override selects a compatible patched 1.x release (`@grpc/grpc-js ^1.14.7`). After a nonbreaking audit-fix pass, the full dependency tree reports 39 remaining advisories (38 moderate, 1 low), with no high/critical advisories. Do not use `npm audit fix --force`: its suggestions include downgrading Expo/Firebase/tooling to incompatible older major versions. Track upstream compatible fixes; Firestore is not used by any screen.

Whole-change independent review: completed. No authentication, persistence, or access-control defects found. One important temporary-layout issue was fixed: onboarding Back/Get Started now stack vertically so their intrinsic widths cannot overflow together on narrow screens with enlarged text. A rendered layout-contract regression was observed failing before the fix, then passing; actual native enlarged-text rendering remains an outstanding device check.

Two minor findings are deferred for the user: consistently applying the shared 48-point touch-height token to Paper buttons, and strengthening the rotation test to assert the actual post-resize nonanimated scroll offset after an initial measured layout. Existing measured-width regression verifies the Next-button offset, but the separate rotation assertion is weaker.

Decisions retained from review: final Figma fidelity and new modules remain deferred (cost: presentation/feature work waits for supplied designs); native gesture/keyboard/large-text/relaunch/splash behavior and Android/tablet parity remain unverified (cost: outstanding device-specific confidence); cloud email delivery/Console settings remain unverified (cost: live-project readiness is pending); Firestore authorization/data behavior remains deferred until there is approved data access (cost: future features still need rules/data verification). The development-only tsx runner is retained to execute the actual service (cost: one small development dependency). Remaining native/live checks above must stay explicit at handover; this record does not claim all device acceptance checks passed.
