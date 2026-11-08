# Main Navigation and Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the Authentication Flow's guest/signed-in Menu screens and shared five-tab navigation, with a default Home placeholder and guest browsing.

**Architecture:** Expo Router provides one guest-accessible main tab group, a nested stack for Menu destinations, and the existing auth stack. AuthProvider remains the sole session authority; the Menu derives its state from the observed user. Centralized auth-layout redirects use an allowlisted return path, while the existing readiness/logout recovery gate stays above all routes.

**Tech Stack:** Existing Expo/React Native/strict TypeScript, Expo Router, React Native Paper/StyleSheet, safe-area context, Expo Image/Font/Constants, bundled Poppins, Lucide, Firebase, Jest/RNTL. No new dependency or backend is needed.

**Spec:** `docs/superpowers/specs/2026-11-08-menu-navigation-design.md` (approved2026-11-08). Figma Authentication Flow frames4005:13901 and4005:14053; older4005:15432 excluded.

## Global Constraints

- Official application name **CamNorte 360**; exclusive coverage **Daet, Camarines Norte, Philippines**. Existing package/bundle/Firebase IDs, Expo slug, URL scheme and storage keys stay unchanged.
- Default landing is **Home placeholder**. Both states use **Home, Explore, Properties, Community, Menu**. Guests can browse; authentication belongs at protected actions, not application entry.
- Implement only these Menu states, navigation and minimal placeholders. No listings, booking, community content, profile editing/storage, wishlist storage, notification subscription/settings mutation or new legal content.
- Auth remains email/password, without email verification or public phone/SMS. Preserve existing sessions, observed-auth navigation, password-policy validation, Terms checkbox and duplicate-submit protection.
- Use form-level alerts only after submission attempts; no inline errors/red validation borders. Keep existing pending-content Terms.
- Android primary: native build/device verification required. Defer iOS. Do not clear main application data, submit live credentials, send live messages or change Firebase policy/billing.
- Reuse supplied logo and bundled Poppins; native system bars replace Figma device chrome. No sample identity, fake counters, mock version or remote design assets in the product.
- Preserve Native/inline execution and the current worktree. Complete branding integration with the user's authorization before branching `codex/main-navigation-menu` from updated main. Review/approve this plan before product edits; no automatic merge/push of the new feature.

## Review Focus

- Delayed/mixed auth restoration must not flash Login or expose stale signed-in Menu; guest startup must remain possible after restoration settles (Task1).
- Login/register/reset navigation and malformed return URLs must not strand guests, escape the app or resume a protected operation automatically (Task1).
- Logout must remain actionable when one auth store signs out before another fails; rapid presses and session changes must not duplicate requests (Task2).
- Small screens,130–200% text, Android insets and long content must retain readable cards, selected tabs and reachable footer/logout without overlap (Tasks2–3).
- Figma sample identity/version and placeholder actions must never imply real profile data, saved content, notification permissions or legal terms (Tasks2–3).

---

### Task 1: Shared guest shell, placeholder routes and observed-auth return navigation

**Files:** Modify `app/_layout.tsx`, `app/index.tsx`, `app/(auth)/_layout.tsx`, `app/(auth)/terms.tsx` (move wrapper), `app/(app)/welcome.tsx`, `features/auth/EmailEntryScreen.tsx`, `features/auth/ForgotPasswordScreen.tsx`, `features/auth/__tests__/navigation.test.tsx`, `features/auth/__tests__/auth-screens.test.tsx`; create `app/(main)/_layout.tsx`, `app/(main)/(tabs)/_layout.tsx`, tab wrappers `home.tsx`, `explore.tsx`, `properties.tsx`, `community.tsx`, `menu.tsx`, stack wrappers `app/(main)/wishlist.tsx`, `account.tsx`, `notifications.tsx`, `privacy-policy.tsx`, and `app/terms.tsx`; create `features/navigation/routes.ts`, `auth-return.ts`, `MainFonts.tsx`, `MainTabBar.tsx`, `PlaceholderScreen.tsx`, tests under `features/navigation/__tests__/`.

**Interfaces:**
- `MainTabKey = 'home' | 'explore' | 'properties' | 'community' | 'menu'`; `MAIN_TABS` defines that exact order, labels and Lucide icon mapping.
- `AuthReturnPath` is the union of `/home`, `/explore`, `/properties`, `/community`, `/menu`, `/wishlist`, `/account`, `/notifications`. `getSafeAuthReturnPath(value: string | string[] | undefined): AuthReturnPath` defaults unknown/array/external values to `/menu`.
- `MainFonts({ children }: PropsWithChildren)` loads local Poppins Regular/Medium with readiness/error/retry; no auth initialization or session state.
- `MainTabBar` receives the installed Expo Router/React Navigation tab-bar props and uses real navigation state/events, `accessibilityRole='tab'` and selected state. Fixed below scroll content; safe-area padding added once.
- `PlaceholderScreen({ title, description }: { title: string; description: string })` renders the shared Poppins/safe-area presentation. Exact default copy: “{title} is coming soon to CamNorte 360.” and “Serving Daet, Camarines Norte.”; no input or mutating action.
- `/menu` initially renders a Menu-labeled placeholder until Task2 replaces it. Existing `useAuth()` and onboarding interfaces are unchanged.

- [x] Confirm approved branding integration/branch prerequisite using Git status, merge-base and worktree inventory. Preserve ignored Firebase files and existing Metro8081; do not create an unnecessary second worktree.
- [x] Write failing router tests: first guest waits for both readiness signals, completes onboarding into `/home`, returning guest opens `/home` without Login, restored user opens `/home` even without onboarding completion, all five tabs/destinations are reachable for guests, and a protected legacy `/welcome` link redirects safely to `/home`. Retain startup/logout error recovery regressions.
- [x] Write failing auth-return tests: every allowlisted path survives; `https://...`, `//...`, `/unknown`, `/login`, `/onboarding`, arrays and absent values resolve to `/menu`. Add auth-flow tests for guest Back, independent Login/Register links with retained returnTo, reset/back preservation, signed-in deep auth entry redirect and observer-driven success returning to its source.
- [x] Run `npm test -- --runInBand features/auth/__tests__/navigation.test.tsx features/navigation/__tests__ features/auth/__tests__/auth-screens.test.tsx`; confirm the intended missing guest-shell/return-path failures.
- [x] Implement the nested main stack/tabs and placeholder wrappers. Root main/auth access is allowed once onboarding is complete or an authenticated user is restored; auth layout redirects observed signed-in users to the safe return path before rendering forms. Retain readiness/error handling and keep navigation decisions centralized rather than redirecting after form promises resolve.
- [x] Move the Terms wrapper to root `/terms`, wrap it in existing AuthFonts so it works outside the auth layout, and leave its pending-content screen unchanged. Remove the old duplicate wrapper. Convert `/welcome` to a thin `/home` redirect and preserve the obsolete phone route without SMS requests.
- [x] Carry validated returnTo between existing auth/reset links; guest Login Back falls back to `/menu`. Implement one shared tab bar and placeholder component with Home as initial tab; keep selected state derived from the router. No extra tab-local session store or protected-action resumption.
- [x] Run the focused suites, full `npm test -- --runInBand` and `npm run typecheck`; require passing. Commit the tested navigation deliverable.

### Task 2: Exact guest/signed-in Menu presentation and existing auth actions

**Files:** Create `features/menu/MenuScreen.tsx`, `MenuHeader.tsx`, `MenuRow.tsx`, `menu-content.ts`, `__tests__/MenuScreen.test.tsx`, `theme/menu.ts`; modify `app/(main)/(tabs)/menu.tsx`, `features/navigation/MainTabBar.tsx`/`theme/menu.ts` for measured tab properties only; add local Figma assets under `assets/menu/` only if the existing logo/generic Lucide avatar cannot supply the actual required asset. Update `AGENTS.md` approved scope.

**Interfaces:**
- Default `MenuScreen(): React.JSX.Element` consumes `useAuth()`, uses the current observed user for the header/Logout visibility, and links only to Task1's routes.
- `MenuHeader({ signedIn, pending, onLogin, onRegister, onAccount }: { signedIn: boolean; pending: boolean; onLogin(): void; onRegister(): void; onAccount(): void })` provides “Hello, Guest” or “Hello, User”, generic avatar and reference secondary actions. No invented name/photo or extra profile backend.
- `MenuRow({ label, description?, icon, tone?, disabled?, onPress })` uses a typed Lucide component, `tone: 'default' | 'danger'`, white-card layout and at least48dp touch target.
- `MENU_SECTIONS` uses the exact reference rows: My Wishlist (“Your saved places and properties”); GENERAL SETTINGS: Account (“Manage user details”), Notifications (“System Default”); ABOUT APP: Privacy policy, Terms & conditions. Logout is a separate signed-in-only card.
- `menuTokens` supplies Poppins typography, measured dimensions and colors from the correct frame pair: background#F5F5F9, white cards, primary rgba(34,48,62,.9), secondary rgba(34,48,62,.7), muted rgba(34,48,62,.4), green#39B54A, icon tile rgba(57,181,74,.16), danger#FF3E1D. Profile title22/28 Medium, row title16/24 Medium/tracking.15, profile action14/20 emphasized, tab label14/20. Inspect font weight/tracking of remaining styles before setting their tokens.

- [x] Inspect and record the exact current Figma frame/container/icon/text measurements, including section spacing/radius, avatar size, tab-bar height/insets and footer. Close any read-only style dialogs without modifying Figma. Reuse locally bundled Poppins/brand assets; export only additional assets actually needed. Do not implement the excluded four-tab frame or support rows.
- [x] Write failing Menu interaction tests: guest Login and Sign up independently open the right auth route with returnTo `/menu`; no guest Logout; both states include the intended cards; signed-in profile action opens Account; all rows open their declared placeholder/Terms destinations; native current version replaces the Figma mock; no Jane Doe/sample personal values or fabricated wishlist count appears.
- [x] Write failing session/action tests: user observer change replaces the guest header and Logout visibility; rapid Logout presses call the existing action once; pending locks relevant controls; successful logout leaves guest Menu usable; partial sign-out recovery survives observer-driven route/state changes. Keep root logout-error tests from Task1.
- [x] Run `npm test -- --runInBand features/menu/__tests__/MenuScreen.test.tsx features/auth/__tests__/navigation.test.tsx`; confirm the expected failures.
- [x] Implement the Menu components/tokens, scrollable cards and footer using existing logo plus `Constants.expoConfig?.version` and available Android build metadata; omit absent build metadata. Maintain guest access to placeholder pages and use session-aware behavior only for header/Logout. Notifications row is navigation only, not a permission request.
- [x] Wire Logout to existing context action/duplicate guard and keep the shared root pending/error/retry lifecycle. Match both inspected frames with the agreed no-guest-Logout and generic-real-data adaptations. No inline validation or fabricated legal content.
- [x] Run focused tests, the full Jest suite and TypeScript. Commit Menu implementation and tests.

### Task 3: Native Android acceptance, documentation and final review

**Files:** Update `docs/verification.md`, `README.md`, `CODEX_HANDOFF.md`, this plan; add safe screenshot evidence under `docs/screenshots/` if useful. Change product code only for demonstrated in-scope verification defects and retain regression coverage.

**Interfaces:** Existing native package `ph.cn360connect.app`; isolated demo QA package/config for automation. Reuse the Firebase adapters/Auth Emulator for actual account actions, not mock success or live accounts. Auth Emulator's missing password-policy endpoint may use the already documented synthetic policy fixture only in a disposable QA copy, never production.

- [x] Run full Jest, strict TypeScript and `git diff --check`. Run `npm run test:policy` and `npm run test:emulator` for final auth-regression evidence; ensure9098 is free and do not stop unrelated processes. Require passing results and record exact counts.
- [x] Build native ARM64 Android and install using `adb install -r` without clearing main data. Use Diorama_API_35 Android15/API35 or record the actual device. For first-launch/session transitions, use an isolated demo QA app and owned Metro; never alter main onboarding/session storage to force a state.
- [x] Compare both Menu states against the correct412×892 Figma frames. Check fonts, avatar/profile layout, cards/icons/chevrons, section labels, footer, tab selected state/colors and real system bars. Verify scroll content ends above the tab bar and no fixed overlay hides Logout.
- [x] Exercise first-launch onboarding -> Home placeholder; all five tabs; guest menu/Login/Register/reset/Back; placeholder and Terms navigation; safe auth deep links/returnTo; actual demo login and registration -> source; process relaunch; logout -> guest Menu; pending/duplicate/error/retry. Do not test unimplemented booking or assert live email delivery.
- [x] Check320dp and130–200% system text, portrait/rotation, Android Back and keyboard, TalkBack labels/selected state, independent guest auth links and long-content wrapping. Record any unexercised behavior precisely instead of treating export success as native proof.
- [x] Use the Native execution workflow's single final independent review after the complete implementation. Address blocking findings through reproductions/regressions and rerun affected checks; preserve the final review outcomes in verification docs.
- [x] Restore only temporary owned device settings; uninstall only QA package, stop only owned QA Metro/emulator and remove its temporary adb reverse/files. Preserve the main app/data, existing Metro8081 and linked worktree. Update docs/scope/handoff, mark completed plan steps and commit verification evidence. Report branch status and stop before further feature work or merge/push.

## Self-review and execution checkpoint

Coverage: Task1 owns shared routes, guest startup, tab selection, auth-return allowlisting/Back and public Terms access. Task2 owns both Menu layouts, actual session-driven UI, version/identity honesty and Logout. Task3 verifies the full path natively, including source authentication/legacy-session regressions, text/insets and cleanup. Every Review Focus item maps to explicit test/native checks. Existing source paths and auth/context interfaces were inspected before this plan; UI-only profile data is deliberately not added to AuthUser.

User decisions retained: Home placeholder default, guest browsing and minimal placeholder destinations. Proposed adaptations requiring review: no guest Logout, generic signed-in identity until profile functionality exists, and centralized auth-layout return redirects. Native/inline execution remains selected. Approved with “proceed” on2026-11-08, including branding integration. Native/inline execution selected.


## Execution closure — 2026-11-08

All three tasks completed inline. Branding6ee4b75 is merged/pushed to main; this Menu feature remains on codex/main-navigation-menu without merge/push. Final174 tests/18 suites, TypeScript, policy2/2, Auth Emulator3/3 and native Android build/device checks passed. Native regression fixes preserved auth return paths, Menu state during sign-out and dedicated partial sign-out recovery. One independent whole-branch review completed; one Important fixed RED->GREEN, three Minors explicitly deferred in docs/verification.md. Full TalkBack traversal, physical devices/iOS/tablets and live delivery are not claimed. See the verification record for precise native evidence, synthetic QA policy boundary, cleanup and deferred findings.
