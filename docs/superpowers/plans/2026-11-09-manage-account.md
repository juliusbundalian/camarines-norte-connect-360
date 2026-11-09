# Manage Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement Figma Account, editable Personal Info, nine-avatar editing, and Changes Saved confirmation from Menu General Settings.

**Architecture:** Preserve onboarding persistence and add explicit completed-profile account operations. Personal Info owns its unconfirmed local draft. ProfileProvider publishes acknowledged identity and selects persistence according to the active authentication source. Owner-only transactions and rules protect completed lifecycle fields and concurrent edits.

**Tech Stack:** Existing Expo 58, React Native 0.88, Expo Router, TypeScript, Firebase JS SDK, native Firebase Auth, Paper, SVG avatars, and Android date picker. Add native Firebase Firestore at the exact installed native App/Auth version for legacy native sessions.

**Spec:** `docs/superpowers/specs/2026-11-09-manage-account-design.md`, approved 2026-11-09.

## Global Constraints

- Official name is CamNorte 360. Coverage is Daet, Camarines Norte, Philippines. Preserve technical identifiers and existing sessions.
- Scope includes Account, Personal Info, existing nine avatars, Changes Saved, and unsaved-edit confirmation. Change Password is deferred and its action is omitted.
- Existing gender/name/nonfuture birthdate validation applies with no minimum age. Optional mobile uses Philippine mobile normalization. Email is read-only account information.
- Save requires valid changed canonical personal values and uses 40% disabled opacity. Form alerts appear after submission/save failure. Preserve duplicate-submit and server validation gates.
- Forward pushes enter from the right. Back pops/dismisses to the right. Personal Info header/footer persist around its scrolling body.
- Missing legacy profiles are created only by an explicit valid complete personal Save. Keep the fixed 2026-11-08T15:03:57.000Z onboarding cutoff.
- Android is primary. Native build and emulator checks are required for this phase. Record device/API and unverified cases. iOS is deferred.
- Reuse current worktree and `codex/manage-account`. Preserve the previously chosen Native/inline execution method, followed by one independent whole-branch review. Plan review precedes execution.
- Keep Metro localhost-only. Local QA uses demo project `demo-cn360-connect`, Auth 9098 and Firestore 8088. Inspect listeners before starting services. Preserve unrelated emulator processes and ignored configuration.
- Production Firestore deployment remains a separate release step. Integration follows a subsequent user request.

## Review Focus

- A completed edit must preserve createdAt/completedAt and status while keeping canonical and draft representations consistent. Task 2 owns actual rules tests.
- Native and JS stores may hold different UIDs. Use the authoritative source and guard responses through sign-out/account switches. Tasks 3–4 own these regressions.
- Another device may change personal information or an avatar while an editor is open. Keep the local form on conflict and preserve unrelated fields. Tasks 2, 4 and 6 own these cases.
- A first legacy Save may commit before its follow-up read fails. Retry must recognize matching persisted values and avoid duplicate creation/revision changes. Task 2 owns the recovery regression.
- Keyboard, enlarged text, hardware Back and modal focus must keep fields/actions reachable and pending saves protected. Tasks 5–7 own component/native checks.

## File map and contracts

Create account UI/domain files under `features/account/`. Keep domain validation reused from `features/profile/profile-validation.ts`. Create `theme/account.ts` only for measured Account/editor values missing from existing tokens.

Create `services/firebase/account-profile-types.ts` for `PersonalInfo = Pick<CompletedProfile,'displayName'|'gender'|'birthdate'|'mobileNumber'>`, `AccountProfileService`, and `ProfileConflictError`. The error carries `latest:UserProfile|null`. Keep runtime SDK imports outside this types module.

`AccountProfileService` exposes `load(uid:string):Promise<UserProfile|null>`, `savePersonalInfo(uid:string, values:CompletedProfile, expectedRevision:number|null):Promise<UserProfile>`, and `saveAvatar(uid:string, avatarId:AvatarId):Promise<UserProfile>`. A null revision means the editor started without a document. The values avatar applies only to first-profile creation. Existing profiles preserve their latest avatar during personal saves. A missing document is rejected by saveAvatar.

The existing JS `profileService` implements these additional operations while retaining its current export and onboarding methods. Create `account-profile-service.ts` and `account-profile-service.native.ts` exporting `getAccountProfileService(source:AuthUser['source']):AccountProfileService`. The native resolver returns the existing JS adapter for JS sessions and the native adapter for native sessions. The base resolver supports JS sessions and rejects unsupported native transport access.

Native adapter lives in `native-account-profile-service.ts`, with lazy Firestore initialization in `native-firestore.ts`. Keep SDK-specific document access separate, with matching data semantics verified by contract tests. If timestamp typing needs adaptation, use a structural `ProfileTimestamp` with `seconds`, `nanoseconds`, and `toMillis()` in `profile-types.ts` so both SDK timestamp instances preserve their values.

ProfileProvider adds optional injectable `accountService?:AccountProfileService` and exposes `accountLoading:boolean`, `accountError:string|null`, `refreshAccount():Promise<void>`, `savePersonalInfo(values:CompletedProfile, expectedRevision:number|null):Promise<void>`, and `saveAccountAvatar(id:AvatarId):Promise<void>`. The default account service is selected by current auth source. Existing onboarding injection remains supported. The editor captures its baseline revision at load and updates it only after a conflict/reload response or acknowledged save.

## Task 1 — Canonical personal editing and display

**Files:** Create `features/account/personal-info.ts` and `features/account/__tests__/personal-info.test.ts`. Consume existing profile types and validation.

**Interfaces:** Produce `PersonalInfoDraft = {displayName:string;gender:Gender|null;birthdateText:string;mobileText:string;avatarId:AvatarId}`, `personalInfoDraft(profile:UserProfile|null):PersonalInfoDraft`, `validatePersonalInfo(draft:PersonalInfoDraft,today:string):CompletedProfile`, `samePersonalInfo(a:PersonalInfo,b:PersonalInfo):boolean`, and `longBirthdate(iso:string):string`.

- [x] Write regression assertions for leap-day long-date display, newborn acceptance, future-date rejection, null legacy fields, mobile national digits, and canonical equality between formatted/normalized mobile values and trimmed names. Confirm `longBirthdate('2001-10-26')` equals `October 26, 2001` across timezone settings. Gender remains Male/Female/Other.
- [x] Run `npm test -- --runInBand features/account/__tests__/personal-info.test.ts` and observe the missing-module/export failure.
- [x] Implement the named functions through existing `validateProfile`, `parseBirthdate`, `formatBirthdate`, and `normalizeMobile`. Construct long dates from calendar components. An absent legacy avatar defaults to avatar-1. Only personal fields participate in `samePersonalInfo`.
- [x] Rerun the focused tests and `npm run typecheck`. Require passing results.
- [x] Commit the domain/display deliverable.

## Task 2 — Explicit JS account transactions and Firestore rules

**Files:** Create `services/firebase/account-profile-types.ts`. Modify `services/firebase/profile-service.ts`, `firestore.rules`, `scripts/profile-emulator.test.mjs`, and `services/firebase/__tests__/profile-service.test.ts`. Extend existing service mocks when their interface requires the new methods.

**Interfaces:** Extend the existing ProfileService interface with AccountProfileService and implement the contract on the existing JS profileService. `ProfileConflictError` represents a changed revision or unexpected document creation/deletion. Both save operations return server-loaded acknowledged profiles.

- [x] Extend actual emulator tests to complete a profile then edit all four personal fields while preserving avatar and both lifecycle timestamps. Assert revision increments once, canonical/draft values agree, and avatar-only saves preserve remotely changed personal fields. Add first valid complete creation at revision0, stale revision conflict, invalid data, immutable timestamp/status/version rejection, guest/cross-owner denial, and unchanged-save no-op cases. Preserve existing lifecycle tests.
- [x] Run `npm run test:profile-emulator` with Node 24 and the Android Studio JBR Java environment. Require failures caused by currently locked completed updates or missing account operations. Stop only owned emulator processes afterward.
- [x] Implement owner-checked transactions. Personal updates compare expected revision and preserve the snapshot's current avatar. Matching canonical personal values return unchanged even on a retry with an older revision. A missing profile permits complete creation only when expectedRevision is null. An unexpected existing complete document with different values produces a conflict. Incomplete profiles retain their onboarding path and cannot be converted through account editing.
- [x] Implement avatar updates against the current complete snapshot, changing avatarId/source and their draft counterparts together. Reconfirming the same avatar ID is a no-op, preserving its current source. A changed ID marks source manual. Never overwrite personal fields from a stale UI snapshot.
- [x] Adapt rules to permit valid completed creation and valid completed-to-completed edits. Require revision0 and server timestamps on creation, revision+1 and preserved lifecycle/version/currentStep fields on edits. Completion from incomplete still sets completedAt to request.time. Completed edits preserve it. Preserve date, mobile, avatar, allowed-key and canonical/draft checks.
- [x] Add the specific partial-success recovery regression. Simulate the post-commit read failing, retry the original Save, and assert a single completed document with unchanged revision. Require a real server read before reporting success to UI. Test owner guards before/after awaited operations.
- [x] Rerun actual emulator tests, service tests and typecheck to green. Commit transactions/rules.

## Task 3 — Native-session profile access

**Files:** Modify `package.json` and lockfile. Create `services/firebase/account-profile-service.ts`, `account-profile-service.native.ts`, `native-account-profile-service.ts`, `native-firestore.ts`, and `services/firebase/__tests__/account-profile-service.test.ts`. Adjust `profile-types.ts` timestamps only if needed by both SDK types.

**Interfaces:** Produce the resolver and native AccountProfileService contracts from the file map. `getNativeFirestore()` initializes one database tied to `getNativeAuth().app` and existing validated configuration.

- [x] Add resolver/adapter contract tests asserting native source uses native UID, JS source uses JS UID, mismatched UID rejects, and native account access never calls the JS-authenticated writer. Cover project mismatch and emulator connection preceding every first read/write.
- [x] Run the focused tests and observe failure before implementation.
- [x] Recheck native App/Auth versions, inspected as 27.1.0 during planning, then install `@react-native-firebase/firestore` at that same version. Use modular APIs supported by installed declarations. Verify any Expo plugin requirement from the installed package rather than inventing a plugin entry. Official references are [usage](https://rnfirebase.io/firestore/usage) and [emulator setup](https://rnfirebase.io/firestore/emulator).
- [x] Implement the native adapter with the same server-read, revision, lifecycle, canonical no-op, first-create, avatar merge and conflict semantics as Task 2. Reuse domain helpers and errors. Configure the validated emulator once before access, retaining existing demo-project restrictions. Assert active native UID and project identity around awaited work.
- [x] Run matching contract cases for native transaction mocks and JS tests. Reserve real native authentication/rules integration for Task 7. Run typecheck and commit adapter/dependency changes.

## Task 4 — Account identity lifecycle and protected routes

**Files:** Modify `features/profile/ProfileProvider.tsx`, its tests, and existing auth navigation tests. Create `features/account/AccountAccess.tsx` and `features/account/__tests__/AccountAccess.test.tsx`. Preserve current Menu identity consumers.

**Interfaces:** Expose the provider methods above. `AccountAccess({children}:PropsWithChildren)` permits authenticated loaded complete/legacy account content. Guests redirect to `/login` with `returnTo:'/account'`. Required onboarding remains owned by the root gate.

- [x] Add regressions for completed identity updating after personal/avatar acknowledgement, missing legacy document remaining legacy on view, voluntary valid creation becoming complete, and native legacy loading through the injected native account adapter. Retain the assertion that native access never touches JS Firestore, updating its harness to supply the appropriate account adapter.
- [x] Add pending write plus logout/UID-switch tests. Old responses cannot update another UID, queued old-account actions are rejected, and duplicate account Save attempts perform one operation. Assert a conflict reloads identity while preserving the caller's local draft and rejecting to its error handler. Existing onboarding conflict recovery still passes.
- [x] Run focused provider/access/auth-navigation suites to RED.
- [x] Select stable account adapters using authoritative source. Eligible native legacy sessions enter phase legacy while the matching account adapter loads identity through separate accountLoading/accountError state. Preserve existing cutoff eligibility. Add acknowledged account mutation adoption with session-generation guards. A native legacy profile-read failure keeps normal browsing available and is retryable within Account. `refreshAccount` retries without resetting onboarding or discarding an editor's local draft. JS startup error semantics retain their current behavior.
- [x] Implement AccountAccess. A direct Personal Info guest entry returns through Account after login. Keep `/account` as the safe authentication return destination and root required-setup gates authoritative.
- [x] Run affected tests and typecheck to green. Commit lifecycle/access changes.

## Task 5 — Figma Account screen and avatar editing

**Files:** Replace `app/(main)/account.tsx`. Create `features/account/AccountScreen.tsx`, `features/account/AccountScaffold.tsx`, `features/account/__tests__/AccountScreen.test.tsx`, and `theme/account.ts`. Modify `features/profile/AvatarSelectionModal.tsx` and its existing tests only for guarded pending/async confirmation support.

**Interfaces:** AccountScreen consumes provider identity/methods and AuthUser.email. AccountScaffold accepts `title`, `onBack`, optional footer, and scrolling children. Existing AvatarSelectionModal gains optional `busy?:boolean` to guard selections, Done and dismissal during persistence. The caller controls pending state and closes only after a successful save.

- [x] Inspect Account child geometry and typography in Figma desktop, including avatar circle/edit button, app bar, card spacing/radii, row/icon dimensions and fills. Record exact measurements in theme/account.ts comments or the existing design notes. Reuse exact existing avatar assets and suitable existing menu/icon components.
- [x] Add component regressions for saved field/email display, absent legacy values showing “Not provided”, absent Change Password action, accessible edit controls, Account Back, and first-profile avatar routing to Personal Info. Cover failed Done preserving picker selection, pending duplicate Done/dismiss protection, unchanged manual avatar no-op and successful Menu identity update through provider coverage.
- [x] Run focused Account/avatar tests to RED.
- [x] Implement the white Account bar, pale body, centered avatar, PERSONAL INFO card and ACCOUNT INFO email row from Figma. Push `/personal-info` from personal pencil. Missing-document avatar action pushes `{pathname:'/personal-info',params:{selectAvatar:'1'}}`. Completed avatar action opens the existing selector and calls saveAccountAvatar. Keep loading/accountError retry UI inside Account.
- [x] Handle hardware/header Back through shared backward semantics and pending guards. Keep text wrapping and scrollability for large font sizes. Run focused tests and typecheck to green. Commit Account/avatar deliverable.

## Task 6 — Personal Info editor and confirmations

**Files:** Create `app/(main)/personal-info.tsx`, `features/account/PersonalInfoScreen.tsx`, `features/account/GenderField.tsx`, `features/account/ChangesSavedModal.tsx`, and `features/account/__tests__/PersonalInfoScreen.test.tsx`. Reuse AccountScaffold. Extend `features/profile/BirthdateField.tsx` with optional `displayValue?:string` and `showHint?:boolean` only if needed to reuse native date behavior while matching the Account design.

**Interfaces:** PersonalInfoScreen consumes Task 1 helpers and Task 4 provider operations. GenderField accepts `value:Gender|null`, `onChange(gender:Gender):void`, and `disabled?:boolean`. ChangesSavedModal accepts `visible:boolean` and `onConfirm():void`.

- [x] Inspect Personal Info and Changes Saved child measurements in desktop Figma before implementation. Preserve four labeled fields, +63 segment, long-form birthdate, fixed bottom action surface, modal copy and 8-unit heading/body gap. Use existing form primitives when compatible.
- [x] Add regressions for pristine/invalid/unchanged canonical Save disabled, valid edited Save enabled, optional empty mobile, native date Cancel/confirmation, dropdown choices, unsaved Stay/Discard on toolbar/hardware Back, and header/footer remaining outside the scroll viewport. Assert no editing/blur alert or inline validation styling.
- [x] Add save success, offline retry, revision conflict, duplicate tap and UID change cases. On conflict, latest identity/baseline revision refresh while all local personal inputs stay available for explicit review and retry. Avatar-only remote changes remain preserved. Reopening the editor starts from acknowledged identity. A failed read after commit shows a retryable failure without a premature Changes Saved modal.
- [x] Run focused editor/date/avatar tests to RED.
- [x] Implement a session-local draft initialized once per active UID and acknowledged baseline. Preserve edits through provider refresh. Use native date selection, accessible gender dropdown, existing name/phone normalization and calendar validation. First-profile avatar selection stays local until complete personal Save. A missing legacy profile enables Save after required fields become valid.
- [x] Guard Save synchronously, disable actions while pending, and display form-level submission failures. Save only on explicit press. On acknowledged success show exact Changes Saved copy and Confirm action. Confirm and modal hardware Back dismiss toward Account. Dirty header/hardware Back uses an Alert with Stay/Discard, while pristine Back returns directly. Screen account switches discard its local draft and stale modal state.
- [x] Run editor/provider/Account suites and typecheck to green. Commit editor/confirmation deliverable.

## Task 7 — Native Android verification, review and context

**Files:** Update `docs/verification.md`, `CODEX_HANDOFF_V2.md`, and AGENTS.md's approved account scope. Store only relevant new verification screenshots in `docs/screenshots/`.

- [x] Run full `npm test -- --runInBand`, `npm run typecheck`, and `npm run test:profile-emulator`. Record counts and require passing results. Run existing actual Auth emulator checks if auth navigation/session changes warrant them.
- [x] Build Android ARM64 debug using the existing Android Studio JBR/SDK setup, including the new native Firestore module. Use the existing Gradle build workflow or `npm run android` with localhost Metro configuration. A JS export alone cannot close this task.
- [x] Verify on Android 15/API 35 Diorama_API_35, emulator-5554, or explicitly record the available replacement. In a disposable isolated demo QA app, exercise guest Account→Login→Account, completed-profile personal edit, dropdown/date controls, pristine/dirty Back, valid/invalid Save, optional mobile, Changes Saved→Account, avatar Done/cancel, and updated Menu identity after restart. Exercise the real native adapter under a disposable pre-cutoff native-auth fixture, including first-profile Save. Any test-only cohort metadata fixture stays confined to the isolated QA copy.
- [x] Check offline save/retry, keyboard focus/Save reachability, enlarged text and modal accessibility focus in the same native fixture. Check each distinct adapter's owner rules with actual local data. Assert preserved native session across reopening and verify that a JS-authenticated edit uses the JS adapter. Record partial/unverified checks honestly.
- [x] Compare requested screens against inspected Figma typography, spacing, colors and asset geometry. Capture Account, Personal Info and Changes Saved evidence. Restore temporary device settings, remove only owned QA package/services/reverses, and preserve the user's main app data and ignored configuration.
- [x] Update context with actual results, the new approved account scope, native adapter dependency, and production rules release prerequisite. Mark plan checkboxes only for verified work. Commit the implementation/context updates.
- [x] Use requesting-code-review for one independent whole-branch review against base `6cf4df7`. Reproduce/fix Important or Critical findings with appropriate regressions and rerun affected checks. Record final review and clean branch status. Keep completed work on codex/manage-account for the user's integration decision.

## Plan self-review

Coverage maps to the approved design. Task 1 owns canonical validation/display. Tasks 2–3 own both persistence paths and rules. Task 4 owns acknowledged identity, guest entry and account lifecycle. Tasks 5–6 own Account, Personal Info, avatar editing and confirmations. Task 7 owns Android/Figma verification, context and review. Review Focus cases each have named regression coverage above. Prior skipped checks are historical records and do not substitute for this phase's verification.

## Completion record — 2026-11-09

Tasks 1–7 implemented and verified within the explicit limits in docs/verification.md. Native accessibility was inspected and TalkBack enabled briefly, but full TalkBack traversal/focus isolation is not established. Physical devices and iOS were not tested. These limits qualify Task 7, rather than claiming the entire platform matrix passed. Independent final review found one Important stale-callback issue; regression tests reproduced it and the session/source preflight fix passed the full suite. No production deployment or branch integration was performed.
