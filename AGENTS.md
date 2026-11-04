# Project development guidance

## Platform priority

- Android is the primary target device/platform for this application.
- Prioritize Android when making implementation decisions, investigating bugs, and verifying features.
- Run native Android build and emulator/device checks before considering platform verification complete. An Expo bundle/export alone does not establish native Android behavior.
- Defer iOS-specific development and testing unless the user explicitly requests it. Existing iOS support may remain, but iOS testing must not take priority over Android.
- Keep verification records explicit about the Android device/API level used and any unverified behavior.

## Scope

Only the initial onboarding and email authentication foundation is approved. Wait for supplied Figma designs and explicit scope before implementing a Home Screen, tabs, tourism, real estate, or community modules.
