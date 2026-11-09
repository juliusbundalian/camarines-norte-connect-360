# Post-registration Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement the five inspected Figma states as required, Firebase-saved, resumable post-registration setup, ending at Home.

**Architecture:** AuthProvider remains the session authority and establishes registration intent before account creation. A separate ProfileProvider owns Firestore lifecycle/drafts and setup eligibility; root routing gates incomplete accounts. One gender screen and one shared profile screen render gender-dependent defaults and a nine-avatar picker.

**Tech Stack:** Existing Expo58/React Native, Expo Router, TypeScript, Firebase JS Auth/Firestore, React Hook Form/Zod, react-native-svg, Expo Image/Font. Use an Expo-compatible native Android date-picker dependency only when implementing its task.

**Spec:** `docs/superpowers/specs/2026-11-08-post-registration-onboarding-design.md` (approved by user on2026-11-08). Source inspection: `docs/superpowers/specs/2026-11-08-post-registration-figma-inspection.md`.

## Audit — 2026-11-09

Status: core functionality implemented, **not every original acceptance item closed**. This audit supersedes the earlier all-checked completion wording below. Latest user refinements and unchanged-draft suppression are implemented; final commit/review checkpoint is recorded below.

| Area | Status |
| --- | --- |
| Task1 validation/cohort/nine assets | Implemented |
| Task2 Firestore adapter/rules/emulator configuration | Implemented; live deployment not verified |
| Task3 resumable account-scoped drafts/conflict recovery | Implemented, including unchanged-draft write suppression |
| Task4 registration modal/routing/setup gate | Implemented |
| Task5 forms/date picker/keyboard handling | Implemented with user amendments below |
| Task6 nine-avatar modal/Menu identity | Implemented |
| Task7 verification/context/review | Substantial checks passed; remaining matrix below |

User amendments now authoritative: step1 has no Back or sign-out shortcut and consumes Android Back; step2 goes backward to step1; shared wrapper keeps top/bottom bars still while body content slides; Next/Finish remain disabled until existing validation passes; form errors stay submission-only; reset page has only the header Back, no duplicate Back to Login link. These supersede the original enabled-invalid-submit, gender Back/logout and whole-screen transition instructions. Existing native Android date dialog and profile persistence remain in scope; new modules/permissions remain excluded.

Current disposition (user instruction on2026-11-09):

- [x] Task3: suppress unchanged draft writes. Equal raw drafts and repeated acknowledged snapshots skip persistence; reverting an unsaved edit skips Firestore. Failed saves remain retryable and explicit operations invalidate cached acknowledgements.
- Skipped by user: remaining full native/a11y/offline/two-device matrix. These cases remain unverified, not passed.
- Skipped by user: live Firestore readiness/rules deployment checks. No remote deployment or verification is claimed.
- [x] Commit/review latest UI refinements and unchanged-draft suppression: implementation commit9c37334; independent review of dc9712e..9c37334 found no Critical, Important or Minor issues and independently passed67 affected tests. No merge/push authorized.

Fresh checks:245/245 Jest tests across28 suites and strict TypeScript passed. Prior native builds and Android15/API35 evidence remain in docs/verification.md; the remaining device checks were explicitly skipped. Physical-device testing remains unverified and iOS intentionally deferred.

---

## Global Constraints

- Official name CamNorte 360; coverage Daet, Camarines Norte. Preserve package/Firebase/Expo identifiers and existing sessions.
- Two steps, gender then profile; three-second success countdown; Home after Finish. No minimum age.
- Form-level validation/submission alerts after submit only; no inline errors, red field borders or typing/blur alerts.
- Required gender, name, real nonfuture birthdate; mobile optional and Philippine mobile validation only when provided. No SMS/email verification.
- Existing accounts continue normal sign-in. Guest browsing remains available. No location/notification permissions, profile editing, uploads or new content modules.
- All nine supplied SVGs may enter the onboarding implementation commit; the earlier exclusion applied to the preceding Menu integration. Do not regenerate them.
- Android first: native build plus emulator/device verification, explicit device/API record. iOS deferred.
- Preserve Native/inline execution preference: implement tasks in this session, one independent whole-branch review at the end. Do not create another worktree; reuse `codex/post-registration-onboarding` after verifying it.
- Do not deploy rules, enable services in production, push/merge, alter billing or expose ignored configuration during local implementation. Report live release prerequisites.

## Review Focus

- Registration observer fires before create-user resolves: success must stay visible and no Main screen flashes (Task4).
- Remote write finishes after UID change or after Finish: no wrong-user draft or completed-status regression (Tasks2–3).
- Calendar boundaries, leap dates and local timezone changes: birthdate remains the selected date with no minimum-age gate (Tasks1,5).
- Native-only restored legacy account: normal access without Firestore permission failures or session migration (Tasks1,3–4).
- Keyboard, large text and Android Back inside the picker/date dialog: actions stay reachable and dismissed drafts behave correctly (Tasks5–7).

## File map and shared contracts

Create `features/profile/` for domain (`profile-types.ts`, `profile-validation.ts`, `profile-cohort.ts`), persistence coordination (`draft-writer.ts`, `ProfileProvider.tsx`), assets (`avatars.ts`, `ProfileAvatar.tsx`) and UI (`ProfileSetupScaffold.tsx`, `GenderScreen.tsx`, `CompleteProfileScreen.tsx`, `AvatarSelectionModal.tsx`, `BirthdateField.tsx`, `RegistrationSuccessModal.tsx`). Create `theme/profile.ts` from measured Figma values. New route group `app/(profile)/` contains `_layout.tsx`, `gender.tsx`, `complete-profile.tsx`. Keep auth-entry success modal in the existing registration screen.

Create `services/firebase/profile-service.ts` (JS-authenticated adapter), `firestore.rules`, `scripts/profile-emulator.test.mjs`. Extend existing Firebase configuration/client laziness for Firestore emulator support. Colocate unit/component tests under each feature's `__tests__` directory. Extend current auth/navigation/Menu tests rather than duplicate their harnesses.

Shared types (Task1 defines, subsequent tasks import):

- `Gender = 'male' | 'female' | 'other'`; `AvatarId = 'avatar-1' | … | 'avatar-9'`; `ProfileStep = 'gender' | 'profile'`.
- `ProfileDraft = {displayName:string; birthdateText:string; mobileText:string; avatarId:AvatarId; avatarSelectionSource:'default'|'manual'}`.
- `CompletedProfile = {gender:Gender; displayName:string; birthdate:string; mobileNumber:string|null; avatarId:AvatarId}`. Canonical birthdate is YYYY-MM-DD.
- `UserProfile`: schemaVersion1, onboardingVersion1, status incomplete/complete, currentStep, gender nullable before selection, draft, canonical fields nullable before completion, createdAt/updatedAt/completedAt server timestamps (completedAt nullable until Finish), and integer revision. Completion requires matching canonical/draft values and profile step; no extra user-defined fields.
- Extend `AuthUser` with `creationTimeMs:number|null` and `source:'js'|'native'`, normalized by the adapter that supplied the observed identity. Auth metadata is used for UX cohort selection, never authorization.
- Profile service: `load(uid:string):Promise<UserProfile|null>`, `ensure(uid:string, initialDraft:ProfileDraft):Promise<UserProfile>`, `saveGender(uid:string, gender:Gender, draft:ProfileDraft, revision:number):Promise<UserProfile>`, `saveDraft(uid:string, draft:ProfileDraft, revision:number):Promise<UserProfile>`, `complete(uid:string, profile:CompletedProfile, revision:number):Promise<UserProfile>`. All methods assert current JS auth UID matches requested UID before work; transactional reads enforce revision/status invariants.

### Task 1: Profile domain, eligibility and validation

**Files:** Create profile-types.ts, profile-validation.ts, profile-cohort.ts, avatars.ts and their tests in `features/profile/`; modify `services/firebase/auth-types.ts`, `auth-service.web.ts`, `auth-service.native.ts` and existing service tests. Include the nine supplied SVGs with the asset registry.

**Interfaces:** Produce `validateGender(value:unknown):Gender`, `validateProfile(gender:Gender|null,draft:ProfileDraft,today:string):CompletedProfile` (throw safe field-ordered form error), `formatBirthdate(iso:string):string`, `parseBirthdate(text:string):string|null`, `normalizeMobile(text:string):string|null`, and `requiresSetup(user:AuthUser, profile:UserProfile|null, rolloutAtMs:number):boolean`. Invalid creation metadata is a recoverable error, not legacy eligibility. Also produce `AVATARS:ReadonlyArray<{id:AvatarId;source:number;label:string}>` and `defaultAvatarForGender(gender:Gender):AvatarId` from a visual comparison of supplied files with Figma; Female/Male match pictured defaults and Other uses avatar-1. These are available before Task3 consumes them.

- [x] Write failing tests: `validateProfile` accepts a newborn's valid birthday and Unicode/single-word names; trims name, rejects blank/>100 code points; accepts leap day2024-02-29, rejects2023-02-29/April31/future day; `formatBirthdate('2008-08-23') === '08/23/2008'`; empty phone→null; `09171234567`, `+63 917 123 4567`, `9171234567`→`+639171234567`; reject landline/extra digits; no age threshold. Test date-only conversion under different TZ settings without parsing through UTC Date.
- [x] Run `npm test -- --runInBand features/profile/__tests__/profile-validation.test.ts features/profile/__tests__/profile-cohort.test.ts`; confirm missing-module/assertion failure before implementation.
- [x] Implement the named functions with explicit date components/leap-year logic, limits and enums. Define `PROFILE_ONBOARDING_ROLLOUT_AT` once as the current UTC instant read at implementation start; record exact ISO literal and meaning in setup docs. Never recompute cutoff at runtime or move it on future releases.
- [x] Test cohort: no doc and creation before cutoff→false; equality/after→true; existing incomplete onboarding doc→true regardless of age; complete doc→false; invalid metadata with no doc→recovery error. Normalize native and JS creation metadata and source, updating all typed fixtures without changing observer precedence.
- [x] Run domain and existing Firebase service tests plus `npm run typecheck`; expected PASS. Commit only Task1 files: `feat(profile): define onboarding cohort and validation`.

### Task 2: Firestore persistence and owner-only rules

**Files:** Create `services/firebase/profile-service.ts`, `firestore.rules`, `scripts/profile-emulator.test.mjs`, service tests; modify `services/firebase/config.ts`, `client-core.ts`, config tests, `firebase.json`, `.env.example`, `package.json`, `docs/firebase-setup.md`.

**Interfaces:** Consume Task1 types; implement the service contract above with Firebase JS Firestore, same app/auth as current email registration. Use default in-memory Firestore caching for this phase; no persistent local profile cache. Native-only legacy identities are excluded from profile reads in Task3, so no native Firestore dependency is needed for this phase.

- [x] Write failing adapter tests for idempotent ensure, owner UID mismatch, rejection propagation, stale revision, completing twice idempotently, draft write after complete rejected, immutable createdAt. Seed emulator tests using actual JS Auth-created synthetic users; never admin bypass for the behavior assertions.
- [x] Run `npm test -- --runInBand services/firebase/__tests__/profile-service.test.ts`; expect missing adapter/failing contract.
- [x] Add development-only `EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST` and `EXPO_PUBLIC_FIRESTORE_EMULATOR_PORT`, paired validation, production rejection, idempotent connection before first operation. Configure Firestore emulator127.0.0.1:8088 alongside existing Auth9098; Android client10.0.2.2. Retain unrelated emulator ports/projects.
- [x] Implement adapter with server timestamps and transactions. `ensure` creates exactly once; canonical fields begin null. Writes check status/revision, update revision monotonically and update timestamps. `complete` is the only transition to completed and writes final canonical values and matching normalized draft in one transaction.
- [x] Implement rules: exact field allowlists; owner-only document get/create/update, no list/delete/public access; constrained draft strings (name<=200 UTF-16 units, birthdateText<=10, mobileText<=32), enum/avatar IDs, immutable createdAt/schema/onboarding version; server timestamps equal request.time where changed; revision increments; no completed regression. For completion require name.trim nonblank with client limit additionally enforced, canonical valid date and nonfuture day, optional normalized phone, complete canonical/draft equality. Implement date format + integer year/month/day bounds and leap-year/day-count validation in rules; do not use regex alone. If rules language limitations prevent a required invariant, stop this task and document the narrow trusted validation solution before changing architecture.
- [x] Add `test:profile-emulator`: `firebase emulators:exec --project demo-cn360-connect --only auth,firestore 'node --import tsx --test scripts/profile-emulator.test.mjs'`. Use fresh unique emails and clean owned contexts; test owner success, cross-user/guest denial, collection-list denial, malformed dates/completion, oversized drafts, stale revision, timestamp protection and no regression.
- [x] Run config/adapter tests, typecheck and `npm run test:profile-emulator`; expect all PASS. Record exact emulator config and explain production Firestore enablement/rules deployment remains pending. Commit Task2 files: `feat(profile): persist resumable onboarding with Firestore rules`.

### Task 3: Session-scoped profile state and draft writes

**Files:** Create `features/profile/draft-writer.ts`, `ProfileProvider.tsx`, tests `draft-writer.test.ts`, `ProfileProvider.test.tsx`.

**Interfaces:** `ProfileProvider` wraps children under AuthProvider; `useProfile()` exposes `phase:'guest'|'loading'|'legacy'|'required'|'complete'|'error'`, `profile`, `draft`, `step`, `error`, `saveState:'saved'|'saving'|'unsaved'`, `setDraft(patch:Partial<ProfileDraft>):void`, `saveGender(gender:Gender):Promise<void>`, `applyAvatar(id:AvatarId):Promise<void>`, `flushDraft():Promise<void>`, `finish(today:string):Promise<void>`, `retry():void`. Service injection for tests follows existing provider patterns.

- [x] Write failing tests for old native-only user→legacy with no JS Firestore call; JS user reads profile/cohort; missing new profile ensured; failed initialization retry does not call register; completed profiles hydrate identity; UID changes clear state and ignore late responses.
- [x] Run `npm test -- --runInBand features/profile/__tests__/ProfileProvider.test.tsx features/profile/__tests__/draft-writer.test.ts`; expect missing implementation failure.
- [x] Implement serialized `DraftWriter` with600ms debounce, captured UID/session generation, pending revision and `flush():Promise<void>`, `dispose():void`. Reads/writes for another UID never enter current state. On completion cancel debounce, drain prior writes, validate and execute complete; no pending write can revert complete. Avoid persisting unchanged content or endlessly retriggering save effects. **Audit: unchanged-draft suppression is still outstanding; see the audit checklist above.**
- [x] Implement provider: load/ensure profile after observed auth settles; legacy native identity with pre-cutoff metadata retains generic Menu and no transport request. New native identity that requires setup without supported matching transport exposes recoverable error/sign-out, never silent bypass. Do not initialize/retry accounts. Update UI optimistically but only mark saved after server acknowledgement; retain unsaved draft on errors without alerts from passive saves. Retry reload must not overwrite an unsaved current-session draft.
- [x] Test600ms coalescing, editing while save in flight, failed write then flush/retry, revision conflict reload/reconcile, Finish after debounce, logout during save, account A response arriving after account B loads. Assert `complete` runs once and is last mutation. Test default gender avatar changes versus preserved manual choice.
- [x] Run provider/writer/domain tests and typecheck; expected PASS. Commit Task3 files: `feat(profile): coordinate account-scoped draft recovery`.

### Task 4: Registration transition and root navigation gate

**Files:** Modify `features/auth/AuthProvider.tsx`, `EmailEntryScreen.tsx`, `app/_layout.tsx`, `app/index.tsx`, `app/(auth)/_layout.tsx`; create `features/profile/RegistrationSuccessModal.tsx`, `app/(profile)/_layout.tsx`, gender/profile route files; extend `features/auth/__tests__/AuthProvider.test.tsx`, `auth-screens.test.tsx`, `navigation.test.tsx` and add modal tests.

**Interfaces:** Auth context adds `registrationPhase:'idle'|'creating'|'created'`, `registrationUid:string|null`, `finishRegistrationPresentation():void`; `register(email,password):Promise<void>` retains existing signature and owns create-user intent. `RegistrationSuccessModal({visible:boolean,onElapsed():void})` uses a three-second elapsed deadline, announces status accessibly and cannot submit again. Route screens consume Task3 provider; temporary neutral setup loaders may render until Task5 replaces them.

- [x] Write failing navigation test with deferred register promise and observed-user callback before promise resolution: current registration screen remains mounted, main never renders, success modal starts only after create success. Failure clears intent and leaves existing error mapping. Another UID cannot inherit the presentation.
- [x] Run auth/navigation tests and modal test; confirm new behavior fails before edits.
- [x] Add synchronous registration intent before service call, scoped generation and double-submit guard. When registration succeeds resolve observed identity safely; profile-initialization failure belongs to setup recovery, not register failure. Session authority stays the observer; no invented session state. Reset transient presentation on session changes, genuine create-user failure or elapsed completion.
- [x] Wrap ProfileProvider below AuthProvider. Gate main/legacy welcome and auth redirects on setup resolution; allow existing registration route to finish presentation while signed in. New group only for required setup; Terms remains usable. Retain logout overlay priority/accessibility isolation and startup handling. `/` resolves required users to last saved step; incomplete main deep links cannot bypass setup. Ordinary login keeps safe returnTo; completed new registration goes Home. On native legacy access no additional remote profile loader blocks navigation.
- [x] Render modal over actual EmailEntryScreen using corrected body and countdown copy from spec. Consume Android Back during creating/created presentation, cancel timers on unmount, use AppState elapsed deadline on resume; onElapsed is one-shot. Do not bind timer completion to the Firestore ensure request or replay on restart.
- [x] Test modal3→2→1→elapsed once, unmount and background/resume, deep link to Menu while required, process restore into profile step, completed registration→Home, existing login returnTo, guest browsing, logout recovery precedence. Save mocked test traces demonstrating no Main flash.
- [x] Run auth/provider/profile/navigation tests plus typecheck. Commit Task4 files: `feat(auth): route new accounts through required profile setup`.

### Task 5: Figma gender/profile screens and native birthdate entry

**Files:** Create `theme/profile.ts`, `features/profile/ProfileSetupScaffold.tsx`, `GenderScreen.tsx`, `CompleteProfileScreen.tsx`, `BirthdateField.tsx`, their tests; finish route wrappers. Modify package/lockfile for date-picker dependency only.

**Interfaces:** `ProfileSetupScaffold({step:1|2,title,subtitle,onBack,busy,children,actionLabel,onAction})`; `BirthdateField({value:string,onChange(text:string):void,disabled?:boolean})` displays MM/DD/YYYY and opens native Android date dialog, with cancel leaving value unchanged. Screens call Task3 methods; no duplicate persistence logic.

- [x] Before writing styles, inspect remaining Design inspector layers in all five source frames: success modal size/padding/gaps/type, screen safe content offsets, Back dimensions, progress dimensions/gaps, headings/body fonts, selection circles, profile avatar/edit dimensions, field heights/radii/borders, bottom area and button tokens. Save numeric findings in source inspection doc. Use Figma desktop per user request; do not claim exact metrics from screenshots alone.
- [x] Write failing component tests: gender starts unselected; **updated:** Next disabled until gender selection; valid Next awaits save; profile fields/date format/no inline messages; Back retains draft; Finish submits through provider once; name/phone edit never shows validation alert. Future/malformed dates fail via Task1 validation.
- [x] Run target component tests; confirm missing components fail. Install `@react-native-community/datetimepicker` through `npx expo install` using existing Expo SDK compatibility, then inspect official package documentation/local types for actual Android props. Record resolved version in lockfile; no iOS work.
- [x] Implement measured styles and scaffold with SafeAreaView, keyboard-aware scrollable content, persistent bottom action surface and exact two-step copy. **Superseded by user amendment:** gender step no longer has Back/logout; Android Back is consumed. Profile Back flushes draft and goes gender, preserving unsaved memory on failure. **Superseded by user amendment:** disable Next/Finish until validation passes, and while pending; do not show typing/blur errors.
- [x] Implement native date dialog with explicit confirm/cancel, local calendar conversion, maxDate today, and neutral initial calendar date that is not stored until confirmation. Keep static MM/DD/YYYY hint. Mobile fixed +63 prefix and phone keyboard; never invoke auth phone service. Text field input limits align with constrained draft rules and Unicode name validation.
- [x] Test Android date confirm/cancel/timezone conversion, keyboard handling, **updated:** gender hardware Back consumed with no Back control, save error retains data, pending controls and accessible selected choices. Run affected tests/typecheck. Commit Task5 files: `feat(profile): build Figma gender and profile forms`.

### Task 6: Nine-avatar picker and saved Menu identity

**Files:** Create `features/profile/ProfileAvatar.tsx`, `AvatarSelectionModal.tsx` and tests. Consume Task1's avatar registry/assets. Modify CompleteProfileScreen.tsx, `features/menu/MenuHeader.tsx`, `MenuScreen.tsx` and existing Menu tests.

**Interfaces:** Consume Task1's `AVATARS` in visual Figma order and `defaultAvatarForGender`; produce `ProfileAvatar({id:AvatarId,size:number})` and `AvatarSelectionModal({visible:boolean,value:AvatarId,onDone(id:AvatarId):void,onCancel():void})`. MenuHeader adds optional `displayName`/`avatarId` while retaining all guest and legacy behavior.

- [x] Visually compare local vectors against Figma and record default female/male IDs and grid ordering; file names alone cannot establish identity. Render supplied SVGs with expo-image local asset support and verify native rendering; if existing SVG tooling requires a wrapper, use react-native-svg without redrawing paths. All nine assets must render, not placeholder icons.
- [x] Write failing tests: nine unique accessible choices in expected order, opening copies current value, tapping changes modal draft only, Done commits once, Back/backdrop cancel retains original, reopening resets draft. Test male/female/Other defaults, manual avatar retained after gender change. Menu completed user shows saved name/avatar; guest and legacy keep existing greeting, logout and links.
- [x] Run avatar/Menu tests; confirm new assertions fail.
- [x] Implement measured380×510/radius16 picker, padding24/32, title24/32,318px grid,90px avatars,24px gaps, yellow Done. Add green outline/selected accessibility state, accessible modal isolation, Android Back dismissal and sizing/scroll fallback for compact/large-text layouts. Done calls provider.applyAvatar and preserves the screen draft on save failure.
- [x] Wire Menu name/avatar only from current UID's completed profile. Never show incomplete/stale profile identity; retain placeholder Account destination. Run avatar/screen/Menu tests and typecheck. Commit Task6 files: `feat(profile): add avatar selection and Menu identity`.

### Task 7: End-to-end Android verification and project context

**Files:** Extend `scripts/profile-emulator.test.mjs`, `features/auth/__tests__/navigation.test.tsx` as needed for missing integration assertions; update `AGENTS.md`, `docs/verification.md`, `docs/firebase-setup.md`, `CODEX_HANDOFF_V2.md`; add relevant screenshots under docs/screenshots.

**Interfaces:** Consume completed Tasks1–6. No new features. Keep live release enablement/deployment separate from locally verified implementation.

- [x] Run `npm run typecheck`, `npm test -- --runInBand`, `npm run test:policy`, `npm run test:profile-emulator` (includes Auth integration); run existing `npm run test:emulator` only if its separate policy/reset/session checks are not already exercised. Expected all PASS; reproduce/fix failures before broad repetition. Use Node>=24.12, existing Java/SDK; never emit secrets.
- [x] Build native Android from android directory: `./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a -PreactNativeDevServerPort=8081`. Verify target serial/device/API with adb, install using `adb install -r` without clearing main app data. For demo Firebase use isolated existing QA application/config workflow, refreshed from current code; never copy synthetic emulator password-policy fixtures into production.
- [x] On Android emulator test a fresh synthetic account: signup success/countdown, unselected gender alert, all gender/default paths, all nine avatars, canceled picker, Done, name/date/optional phone validation, valid Finish, Home then Menu identity, relaunch completed account. Verify no inline typing/blur errors. Record native date dialog behavior, not only a mocked component test.
- [x] Test resume after process death at both steps and after acknowledged profile draft save; network unavailable on ensure/Next/draft/Finish, retry, no duplicate account creation or false completion. Confirm no async write affects a second synthetic UID, preserved old email/native accounts, ordinary login returnTo, guest access after exit and deep-link gating.
- [x] Verify keyboard, Android Back through form/picker/date modal,320dp width,130% and200% text, rotation, TalkBack labels/selection/modal focus, and screenshots against412px Figma reference. Restore emulator settings. Record device name/API, actual checks, screenshots and unverified behavior in docs/verification.md; report any unavailable native-only fixture honestly.
- [x] Update AGENTS scope and V2 handoff with exact rollout cutoff, interfaces, new branch/status, completed verification and production Firestore prerequisite. Keep secrets/config identifiers unchanged. Commit verification/context changes: `docs: record Android profile onboarding verification`.
- [x] Use preserved Native workflow's one independent whole-branch review; address real defects, rerun checks affected by fixes, then report final status. Do not merge/push until separately requested.

## Self-review and execution handoff

Coverage checked against every design section: flow/visuals Tasks4–6; field rules/cohort Task1; Firestore/rules Task2; resumable drafts/session isolation Task3; legacy preservation/deep-link routing Task4; Menu Task6; native Android/release docs Task7. All shared interfaces are defined above and reused by name. Review Focus conditions each have explicit owning-task tests.

Completed with Native/inline execution. Task7 verification limits, rulings and one independent review with three verified fixes are recorded in docs/verification.md. Checkboxes indicate the listed work was performed with those explicit limits; unverified device permutations are not claimed tested. Feature branch retained without merge/push.
