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

The onboarding foundation, Figma login/registration using email and password, password recovery, and pending-content native Terms page are approved. Email verification is intentionally omitted. Phone/SMS is retired from the public flow; preserve existing sessions and accounts. The guest/signed-in Menu and five-tab shell (Home, Explore, Properties, Community, Menu), with minimal placeholder destinations and guest browsing, are now approved under the 2026-11-08 navigation plan. Home is the default placeholder. Authentication is required at protected actions, not app entry. Actual Home content, profile editing, booking, wishlist storage, tourism, real estate, community modules and notification integrations still require supplied designs and explicit scope.

## Form feedback

Use form-level error alerts for validation and submission failures. Do not add inline field-validation messages or validation-driven red field borders. Do not show validation alerts merely while typing or on blur; show them after a submission attempt. Preserve validation gates, duplicate-submit protection, and the registration password requirements checklist.
