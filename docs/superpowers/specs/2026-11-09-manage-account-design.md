# Manage Account design

Approved by the user on 2026-11-09, including the proposed decisions recorded below.

## Intent and approved scope

Implement the Menu General Settings Account destination, its Personal Info editor, avatar editing, and saved-changes confirmation using the existing CamNorte 360 architecture. The user explicitly deferred Change Password. The existing Menu supplies the General Settings entry point.

The implementation uses the existing five-tab shell, authentication, profile model, nine supplied SVG avatars, typography, and Android-first workflow. Coverage remains Daet, Camarines Norte, Philippines.

## Source inspection

Figma file is Rewards Appv (Copy), file key `Y9XPx697YfMPFKkQzblkqc`, CamNorteConnect page, Manage Account section. Account, Personal Info, and Personal Info- Changes Saved were inspected in the desktop app. The connector reached its Starter-plan tool limit. Desktop inspection continues the previously authorized fallback workflow. Remaining child measurements must be inspected before implementing the corresponding component.

Personal Info frame is `4041:24410`. Changes Saved frame is `4041:26292`. Both are 412 by 892 design units. Account also measures 412 by 892.

Account shows a white Back/title bar, pale body background, centered circular avatar with green pencil action, a white rounded PERSONAL INFO card, and a white rounded ACCOUNT INFO card. Personal rows show a green icon tile, value, and smaller field label. Fields are name, gender, birthdate, mobile contact, and authentication email. A pencil in the personal card opens editing. Account has no bottom tab bar.

Personal Info shows a white Back/title bar, four vertically stacked labeled fields, and a persistent white bottom Save surface. Gender is a dropdown. Birthdate has a calendar action and long-form display. Mobile has a separate +63 prefix. Save uses the established amber action color and disabled opacity. Search highlights visible during inspection are Figma search UI.

Changes Saved shows a centered white rounded modal over the dimmed editor, heading “Changes Saved”, body “Your changes have been saved successfully.”, and amber Confirm button. Reuse the existing modal typography and the established 8-unit heading/body gap, verifying remaining spacing against selected layers.

## Approach

Extend the current profile persistence boundary with explicit account-edit operations and reuse existing validation, avatar selection, and native date selection. Local editing state belongs to the account editor. The shared provider supplies acknowledged identity to Account and Menu.

This is the implementer's recommended approach. An explicit Save matches the supplied screen and provides a clear acknowledgement point. Avatar picker Done is the separate confirmation point for an avatar update. Existing onboarding methods retain their lifecycle responsibilities.

## Navigation and authentication

- Menu Account and signed-in Update personal info open Account.
- A guest opening Account is taken to Login with the existing safe `/account` return destination. Successful authentication returns to Account, subject to required post-registration setup.
- Account personal pencil pushes Personal Info. Header and hardware Back pop toward Account. Cold entry uses a backward dismissal to Account.
- Account Back returns to the actual prior screen, with Menu as the cold-entry fallback.
- Forward transitions enter from the right and Back dismisses to the right using the shared stack configuration.
- Personal Info keeps its header and bottom Save surface fixed around the scrolling form. This is a single editor rather than an additional onboarding step.
- Change Password is deferred by user instruction. The proposal is to omit that action from this phase's Account card. Email is displayed as account information.

## Display and editing behavior

Account displays persisted profile data and the authenticated account's email. Format saved ISO dates as a long English date without UTC conversion. An absent optional mobile displays “Not provided”. An absent legacy personal field displays “Not provided”. An account without email displays “Not provided” in that row.

Personal Info starts from the acknowledged profile, with name and gender, the canonical birthdate converted for the existing validator, and mobile split into +63 and its national digits. Required name, gender, and real nonfuture birthdate retain the existing rules. No minimum age applies. Mobile remains optional and uses existing Philippine mobile normalization. Phone/SMS verification is outside this flow.

The proposed gender choices are Male, Female, and Other. Use an accessible dropdown selection surface. Birthdate uses the existing Android native picker with the existing maximum date and calendar-only conversion. Its visible field follows Figma's long-form date treatment.

Save is disabled until the canonical personal values are valid and changed, and while an operation is pending. Use 40% disabled opacity. Equivalent formatting changes do not trigger writes. No typing or blur alerts, inline error messages, or validation-driven red borders are introduced. Submission/save failures produce a form-level alert and retain the draft for retry.

After an acknowledged save, show Changes Saved. Confirm returns to Account, where the updated data is visible. Hardware Back while this acknowledgement is visible follows the same return behavior. Proposed unsaved-edit behavior is a discard confirmation on header or hardware Back, with Stay and Discard actions. A pristine editor returns directly.

Account avatar pencil opens the existing nine-avatar selector, initialized from the saved selection. Done persists a changed selection and closes only after acknowledgement. Failure retains the selection for retry through a form-level alert. Back/outside dismissal discards the unconfirmed avatar choice. Reconfirming the saved avatar does not write. Gender changes preserve the chosen avatar. Explicit avatar selection marks its source as manual.

The avatar-only operation must preserve every personal field, including concurrent changes. Personal Info Save must preserve the current avatar. Account and Menu update only with acknowledged data from the same active UID. Implementation clarification for the unchanged-save rule means reconfirming the saved avatar ID preserves its selection source without a write, while changing to another avatar marks its source manual.

## Persistence and compatibility

Add account-edit operations at the existing profile service boundary rather than passing account changes through onboarding draft methods. Persist canonical personal values and their corresponding draft representations together, increment revision, and use server updatedAt. Preserve schema/onboarding versions, completed status, current step, createdAt, and completedAt for completed profiles.

Firestore rules must explicitly permit valid owner-only completed-profile updates with immutable lifecycle fields and revision increments. Retain incomplete-profile protections and completion invariants. Adapt completedAt validation so editing preserves the original completion timestamp. Keep actual calendar, mobile, avatar, and canonical/draft consistency checks.

For an older account without a profile document, merely viewing Account or opening/cancelling Personal Info creates no document. Saving a valid complete personal form creates a completed document transactionally. Such an explicit save does not send the user through registration onboarding. Preserve the fixed cohort cutoff. For an account without a document, the proposed avatar behavior is to keep the choice in the Personal Info editing session and require the complete personal form to save the first profile. The account avatar action opens that editor with the picker. This avoids persisting a partial document that could trigger required onboarding on an older account.

Older native-only sessions currently have a separate authentication store from the JS Firestore client. Support these sessions using a profile adapter authenticated by the matching native Firebase session. This may require adding the matching `@react-native-firebase/firestore` dependency and a native Android rebuild. Reuse the same rules and data contract. Keep the JS-authenticated adapter for email sessions. Select the adapter using the authoritative AuthUser source and UID. Verify SDK compatibility and emulator configuration during planning. A native legacy account with no profile retains normal browsing eligibility while editing is voluntary.

Concurrent edits use revision checks. On a conflict, reload the latest persisted profile, preserve the local form, and show an alert asking the user to review/retry. Do not silently overwrite a second device's acknowledged personal edit. An avatar-only transaction merges only avatar fields against the current complete document. Duplicate taps are synchronously guarded. A UID change or sign-out discards pending UI state and prevents late responses from updating another account's display.

Transactions require connectivity. Offline save fails with retryable form feedback and keeps the unsaved local edit in the current session. The proposal does not persist unconfirmed editing drafts across process termination. Onboarding retains its own saved-draft behavior.

## Verification and delivery

Add regression coverage for guest return, editing completed profiles, unchanged canonical saves, missing legacy documents, native/JS adapter selection, avatar/personal-field isolation, conflict preservation, duplicate submission, and UID changes. Extend actual local Firestore emulator tests for completed edits, immutable lifecycle fields, owner isolation, direct valid profile creation, stale revisions, and rejected malformed data.

Run the full test suite and strict TypeScript. Build native Android and verify Account entry, real edit controls, Back/discard, disabled Save, success confirmation, avatar selection, Menu identity refresh, and keyboard reachability on the available Android 15/API 35 emulator. Use disposable local fixtures/accounts for data changes. Record actual device/API and limitations. Compare implemented screens with desktop Figma measurements and screenshots.

The prior phase's skipped device matrix and live Firestore checks remain recorded in its own verification history. This phase needs its own relevant Android verification. Production Firestore deployment remains a separate release step. Implementation, review, and local commits occur on `codex/manage-account`. Integration follows a subsequent user request.

## Proposed decisions for user review

- Include avatar editing using the existing nine choices.
- Omit the deferred Change Password action for this phase.
- Show a discard confirmation when leaving edited Personal Info.
- Confirm on Changes Saved returns to Account.
- Older accounts can voluntarily create a complete profile through Save. Their first avatar choice is saved with that personal form.
- Extend profile persistence to support older native sessions under their existing identity.

These are implementer proposals for approval, except the user's explicit Change Password deferral.
