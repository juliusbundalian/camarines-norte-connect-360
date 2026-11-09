# Project development guidance

## Branding and geographic coverage

- Official application name: **CamNorte 360**. Use this exact name in display configuration, documentation, and user-facing text.
- Exclusive geographic coverage: **Daet, Camarines Norte, Philippines**. Tourism destinations, real estate, community information, events, sample data, and location-specific features must focus only on Daet. Other municipalities require an explicit user request.
- Preserve existing package/bundle identifiers, Firebase configuration/project IDs, Expo slug, deep-link scheme, and storage keys unless a technical change is explicitly necessary.
- Existing architecture, Figma workflow, approved development phase, and other requirements remain in effect. Branding/scope updates do not authorize new screens or modules.

## Platform priority

- Android is the primary target device/platform for this application.
- Prioritize Android when making implementation decisions, investigating bugs, and verifying features.
- Run native Android build and emulator/device checks before considering platform verification complete. An Expo bundle/export alone does not establish native Android behavior.
- Defer iOS-specific development and testing unless the user explicitly requests it. Existing iOS support may remain, but iOS testing must not take priority over Android.
- Keep verification records explicit about the Android device/API level used and any unverified behavior.

## Scope

The onboarding foundation, Figma login/registration using email and password, password recovery, and pending-content native Terms page are approved. Email verification is intentionally omitted. Phone/SMS is retired from the public flow; preserve existing sessions and accounts. The guest/signed-in Menu and five-tab shell (Home, Explore, Properties, Community, Menu), with minimal placeholder destinations and guest browsing, are now approved under the 2026-11-08 navigation plan. Home is the default placeholder. Authentication is required at protected actions, not app entry. Actual Home content, booking, wishlist storage, tourism, real estate, community modules and notification integrations still require supplied designs and explicit scope.

## Form feedback

Use form-level error alerts for validation and submission failures. Do not add inline field-validation messages or validation-driven red field borders. Do not show validation alerts merely while typing or on blur; show them after a submission attempt. Preserve validation gates, duplicate-submit protection, and the registration password requirements checklist.

## Post-registration profiles

The 2026-11-08 post-registration onboarding design/plan is approved: three-second account-success modal, required gender then profile, nine supplied avatars, name and nonfuture birthdate required with no minimum age, optional Philippine mobile contact only, owner-only Firestore saved drafts/completion and Menu identity. New accounts from the fixed2026-11-08T15:03:57.000Z cutoff resume setup; older accounts keep normal access. No SMS is added. Account editing is separately approved below. Production Firestore enablement/rules deployment is a separate release prerequisite; never infer deployment from emulator checks.

## Navigation transitions

Forward stack navigation pushes a screen in from the right. Back actions must pop/dismiss the current screen out to the right, revealing the prior screen; do not implement Back as a forward push or default push-style replacement. Use router.back() for the actual prior route, or router.dismissTo(destination) when returning to a named earlier screen. Shared features/navigation/stack-options.ts sets slide_from_right and animationTypeForReplace:pop so cold/deep-link Back fallbacks also move backward. Preserve returnTo parameters, pending-submit guards, and step1 post-registration Back blocking. Tabs and modal dismissals retain their own navigation semantics.

For post-registration and similar multi-step forms, keep shared header/progress and bottom action bars in a persistent wrapper and animate only the content viewport between steps. Primary Next/Finish actions remain disabled (40% opacity) until the existing validation rules pass, and while submitting. Do not show validation alerts during editing; preserve form-level submission/save failures and server-side validation gates.

## Manage Account

The 2026-11-09 Manage Account design/plan is approved: protected Account from Menu General Settings, editable name/gender/nonfuture birthdate and optional Philippine mobile, nine-avatar editing, Changes Saved and unsaved-discard confirmations. Email remains read-only; Change Password is deferred and omitted. Save requires valid changed canonical values and is disabled at 40% opacity otherwise or while pending. Legacy accounts create a complete profile only on explicit valid Save. Use the authoritative JS/native auth source, reject stale session callbacks before SDK access, preserve completed lifecycle timestamps and remotely updated unrelated fields, and require a server acknowledgement. Native Firestore 27.1.0 supports restored native sessions. Production Firestore enablement/rules deployment remains a separate release prerequisite.
