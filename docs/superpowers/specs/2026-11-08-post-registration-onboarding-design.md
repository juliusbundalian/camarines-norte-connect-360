# Post-registration onboarding design

Status: approved by the user on 2026-11-08. Planning only; no product implementation yet.

## User amendments and audit — 2026-11-09

Later user instructions supersede the original interaction details: step1 has no Back/sign-out action and consumes Android Back; step2 returns with backward content-only motion; persistent wrapper bars stay still. Next/Finish are disabled until the existing validation rules pass. Reset-page duplicate Back to Login link was removed. See the implementation plan's 2026-11-09 audit for outstanding unchanged-draft write suppression, verification coverage and live deployment checks. Original design below is retained as history where it conflicts with these amendments.

## Intent and approved decisions

New CamNorte 360 email/password registrations complete a required, resumable profile setup using the supplied Authentication Flow Figma designs. Existing accounts continue normal sign-in. Guest browsing and existing authentication behavior remain available. Geographic coverage remains Daet, Camarines Norte.

The user selected a two-step gender → profile flow, a three-second account-success modal with corrected profile-setup copy, Home after Finish, Firebase persistence with resume, and no minimum age. Gender, name and a valid nonfuture birthdate are required. Mobile is optional and validated as a Philippine number only when supplied. All nine avatar SVGs are now supplied; each parses with a 90×90 viewBox.

## Approaches

- Recommended: Firestore user profile documents, resumable progress, shared profile screen with gender-dependent default avatar. Fits the existing Firebase stack and the user's Firebase/resume choice. Requires profile rules, authenticated SDK access, emulator coverage and registration-aware routing.
- Local-only setup: smaller integration but cannot reliably resume across devices or supply an authoritative shared profile; ruled out by the user's choice.
- Separate male/female profile screens: duplicates the same fields and behavior; use one screen with variant data instead.

The following technical and interaction details originated as implementer proposals and were included in the approved design.

## Screens and interactions

1. After Firebase account creation succeeds, present Account Registered over the current email registration form. Retain its submitted-state appearance without reviving Figma's old phone-based registration. Body: “Your account creation is complete. You’ll continue to profile setup shortly.” Show “Redirecting in 3s”, updating the countdown. At three elapsed seconds continue to gender. Do not replay this transient success modal on relaunch. Cancel timers on unmount/session change; backgrounding must not result in duplicate navigation. Android Back cannot return to a now-submitted registration form during this short transition.
2. Gender: “1 of 2”, half progress, exact Figma heading/subheading, Male/Female/Other circular choices. Start with no choice; the green Male in the frame illustrates selection. Next validates on submit, saves the choice and advances. Save errors use a form-level alert and retain selection. No Skip. Back offers leaving setup by signing out through the existing logout confirmation; cancel preserves the draft. This lets a user return to guest browsing without deleting their new account.
3. Profile: “2 of 2”, full progress, shared heading/subheading, larger avatar with green pencil action, Name, Birthdate and optional Mobile Number, fixed white bottom Finish area. Male/Female get the exact pictured defaults; Other defaults to the first supplied avatar as an implementer choice. All nine choices remain available regardless of gender. Changing gender updates an automatic default, but preserves an explicitly selected avatar. Back returns to gender without clearing fields.
4. Avatar picker: centered Select Avatar modal, nine supplied SVGs in Figma order, 3×3 grid, Done. Tapping selects a draft with an accessible selected state and a restrained green outline. Done applies it to the profile draft. Android Back/backdrop dismissal discards changes made since opening the picker. No photo upload or additional visible cancel button.
5. Finish validates the entire profile and writes the completed document. Only acknowledged successful completion opens Home. Duplicate taps cannot create duplicate writes/navigation. Errors retain inputs and use an alert with retry through Finish. Menu consumes the saved name/avatar after completion; Account remains its current placeholder, with no profile editing added.

## Visual contract

Use `2026-11-08-post-registration-figma-inspection.md` for source frame/node IDs and measured values. Screen reference is 412×892, background #F5F5F9. Picker: white380×510 at reference size, radius16, padding24 horizontal/32 vertical, gap24. Grid318×318 with 90px avatars and24px gaps. Title24/32, text-primary #22303E at90%. Keep yellow actions, green progress/selection/edit control, gray Back control, and original typography styles from each inspected layer. Capture remaining exact layer metrics from desktop Figma before styling those layers; do not copy device status bars, camera holes or simulated home indicators.

Map source SVGs to visual identities rather than assuming numbered file order equals Figma order. Render the supplied vectors using existing SVG-capable infrastructure; no asset regeneration. Layout adapts to Android safe areas, smaller widths, keyboard and large text with scrolling where needed; fixed action areas must not hide fields. Picker may shrink grid spacing/avatars or scroll on constrained screens while preserving usable targets. Public Sans/Poppins decisions follow inspected text styles rather than inheriting Menu fonts blindly.

## Validation and date/phone behavior

- Gender: one of male/female/other.
- Name: trimmed, nonblank, at most100 Unicode code points; permit single-word and international names. No alphabet-only restriction.
- Birthdate: required real calendar date on or before the device's local today; no age threshold. Display MM/DD/YYYY consistently for both variants. Use a native Android date picker, opening on a neutral date rather than silently setting a birthdate. Store YYYY-MM-DD as a date-only string to avoid timezone shifts. Recheck on Finish.
- Mobile: optional; fixed +63 presentation. Accept common Philippine national/international mobile input, normalize to +639 followed by9 digits, reject malformed/nonmobile entries. Store null when blank. Contact data only: no SMS, verification, auth linking, account identifier change or uniqueness gate.
- Errors only in form-level alerts after Next/Finish; no inline errors, red borders or typing/blur validation alerts. The static date format hint is helper text, not an error. Preserve all existing registration gates and password checklist.

## Persistence, registration cohort and recovery

Use a versioned owner-only Firestore document at `users/{uid}` with schemaVersion, onboardingVersion, status(incomplete/complete), currentStep, gender, avatarId, avatarSelectionSource(default/manual), displayName, birthdate, mobileNumber, createdAt, updatedAt, completedAt. Use stable avatar IDs and server timestamps. Keep profile contact data separate from Firebase Auth's phoneNumber. Do not store email/password in profile documents.

Registration and profile creation cannot be atomic across Firebase Auth and Firestore. Establish onboarding intent before starting registration so the observed sign-in cannot redirect past the modal/setup. After create-user, ensure the incomplete profile document idempotently; a failed initialization shows recoverable setup, never retries account creation. Clear registration intent on genuine create-user failure. AuthProvider remains session authority.

To preserve existing accounts without depending on document absence, define and document a fixed UTC onboarding rollout cutoff in the release configuration. Compare trusted Firebase Auth creation metadata with that cutoff; accounts created before it with no onboarding document retain normal access. Accounts created at/after it must initialize/resume setup even if a crash happened before their first Firestore write. A document already marked as requiring this onboarding takes precedence for recovery. Never derive eligibility from last-sign-in time or “first launch on this device”. Missing/invalid metadata or profile-read errors must not be interpreted as completion; show retry/sign-out recovery until resolved. This is a UX setup gate, not authorization for future bookings or sensitive features.

Existing native phone accounts must remain signed in and usable. Select the profile transport authenticated as the same observed UID: JS Firestore for JS auth identities, native Firestore adapter if needed for restored native identities. Do not copy credentials, mint custom tokens or silently migrate sessions. The implementation plan must inspect SDK availability and test both identity paths; defer reading profile data for a legacy native identity if it has no required setup and no supported authenticated profile transport, retaining its current generic Menu identity.

Save gender/currentStep before leaving step1. On profile, persist draft changes to Firestore after a short debounce; flush on Back, picker Done and Finish. Separate a constrained draft map (raw displayName/date input/mobile text, avatar choice) from canonical completed fields, so partial input can resume without being treated as valid. No per-keystroke validation alerts. Draft writes are serialized/versioned to prevent a late draft write undoing completion; cancel stale work on UID change. A saved indicator or unobtrusive save-state message may appear only for actual unsaved/save-failure state; errors from passive draft writes do not raise typing alerts. Finish still reports submission failure if persistence is unavailable. Resuming returns to the last acknowledged step/draft. Offline/unacknowledged changes may be lost on process death; do not claim they are saved. No persistent local profile cache is required for this phase.

After successful completion, never reopen setup on normal launches; re-read remote state as needed. Deep links to main screens cannot bypass required setup. Guest routes remain usable after sign-out. Clear in-memory drafts, pending timers/listeners and UID-specific read state on session changes; never display another account's draft. Preserve the existing safe auth-return mechanism for ordinary login; newly completed registrations intentionally open Home per the user's choice.

## Firestore boundaries

Rules permit only an authenticated owner to read/write their own document, allowlist fields and types, constrain draft sizes, validate enum/avatar IDs, require all completed canonical fields, protect creation metadata, and prevent accidental regression from complete to incomplete. No public profile reads or collection listing. Test cross-user denial, unauthenticated denial, malformed completion, oversized draft and valid lifecycle in the emulator. Profile setup does not grant roles. Birthdate rules must enforce a real canonical date through appropriate trusted validation; do not mistake a date-shaped string for calendar validation. The plan may use explicit server-side validation if needed rather than claiming client-only validation is security enforcement.

Implementation includes Firestore emulator configuration, rules/tests and setup documentation. Production Firestore enablement/rules deployment is an explicit release prerequisite, to be reported separately from local implementation; do not change live Firebase configuration or deploy rules as part of planning.

## Scope and verification

Included: the five requested design states, registration-aware navigation, resume, profile persistence/rules, existing-account compatibility, nine vector assets, and Menu identity display. Excluded: location permission frame, notification permission, interests, profile editing, photo uploads, real Home/content modules, SMS and email verification.

Plan meaningful tests for auth-observer timing, failed initialization without duplicate account creation, old/new cohort boundaries, relaunch/deep-link gating, UID changes, draft/complete write ordering, date-only handling, optional phone validation, avatar Done/cancel, save errors and duplicate submits. Run existing checks to protect auth/Menu behavior. Required native Android build and emulator checks include successful registration→countdown→gender→profile→picker→Finish→Home, restart mid-setup, failed save/retry, existing sessions, guest exit, keyboard, native date-picker cancel/confirm, Back, compact screens, text scaling and TalkBack labels. Record actual Android device/API and anything unverified. iOS is deferred.

## Approval

The user approved this design on 2026-11-08. The implementation plan is `docs/superpowers/plans/2026-11-08-post-registration-onboarding.md`. No product code or dependencies changed during the design/planning pass; implementation awaits review of that plan.
