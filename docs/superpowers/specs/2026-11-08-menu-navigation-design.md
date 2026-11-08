# CamNorte 360 — Guest navigation and Menu design

Date:2026-11-08, Asia/Manila. Status: approved with “proceed” on2026-11-08; Native/inline execution selected.

## Approved inputs and boundaries

The user selected the Menu - Logged Out and Menu - Logged In frames in the **Authentication Flow** section and requested both Menu states plus bottom navigation first. The user confirmed:

- Start on a **Home placeholder** after onboarding and on returning launches.
- Do not require authentication to open or browse the application. Require it at protected actions, such as future booking.
- Create minimal placeholder destinations for the unimplemented tabs and menu links.

Official brand is **CamNorte 360**; geographic coverage is exclusively **Daet, Camarines Norte, Philippines**. Existing email/password, no-email-verification, account/session compatibility, alert-only form feedback and pending Terms requirements remain. No booking, account editing, wishlist storage, notification subscription, tourism/property/community content or other backend features are included.

## Figma evidence

Inspected directly in Figma desktop, file `Y9XPx697YfMPFKkQzblkqc`, CamNorteConnect page `4004:12526`:

- **Menu - Logged Out:** `4005:13901`.
- **Menu - Logged In:** `4005:14053`.
- Both are412×892 and use **Home, Explore, Properties, Community, Menu**, with Menu green/selected. The older `4005:15432` Menu inspected initially is excluded; its four-tab navigation and additional support rows are not requirements.
- Guest header: generic avatar, “Hello, Guest”, “Login or Sign up” and chevron. Signed-in header: circular avatar, sample “Jane Doe”, “Update personal info” and chevron.
- Both contain My Wishlist / “Your saved places and properties”; GENERAL SETTINGS with Account / “Manage user details” and Notifications / “System Default”; ABOUT APP with Privacy policy and Terms & conditions; logo and version footer. Logout is drawn in both references, but is a signed-in action only in the proposed behavior.
- Background#F5F5F9; white cards; primary text#22303E at90%; secondary at70%; muted at40%; green#39B54A; green icon tiles at16% opacity; logout#FF3E1D.
- Inspected text styles: profile title22/28 emphasized, row title16/24 medium with0.15 tracking, profile action14/20 emphasized, tab labels14/20. Style-variable inspection confirms **Poppins**; Title Medium uses Medium weight and Title Large emphasized uses Medium. Reuse bundled Poppins Regular/Medium; do not reuse Public Sans auth typography for Menu.
- Native Android status/navigation bars replace the drawn device chrome. Figma prototype arrows, screenshot dimming/selection outlines, sample personal details and mock version1.0.1(12345) are not application content.

At implementation, inspect container/icon bounds in these exact frames for the final spacing, radii and local asset exports; record measurements rather than treating screenshot estimates as exact design tokens. Current screenshot proportions suggest16dp section spacing/padding,64dp avatar and40dp icon tiles; these are initial estimates, not measured acceptance claims.

## Approach and alternatives

**Proposed approach: one shared Expo Router tab shell and one session-aware Menu screen.** Expo Router owns navigation and history. Existing AuthProvider owns observed session state. The shell is available to guests once onboarding is complete and to restored authenticated users even if onboarding completion is absent. This keeps the two Figma states synchronized with actual authentication without duplicated route trees.

Two independent guest/authenticated tab trees would repeat the same five tabs and complicate session transitions. A component-local tab switcher would not provide consistent route/deep-link/Android Back behavior. The shared router shell is recommended.

## Routes and startup

- Root readiness/error gate still waits for authentication and onboarding restoration; retain startup retry and cross-store sign-out recovery.
- Unauthenticated first launch -> onboarding -> `/home`. Returning guests and signed-in users -> `/home`.
- Tabs: `/home`, `/explore`, `/properties`, `/community`, `/menu`. The first four render minimal, clearly labeled Daet-focused placeholders with no fabricated listings, counters or content.
- Menu destinations: `/wishlist`, `/account`, `/notifications`, `/privacy-policy`; each is an explicitly labeled placeholder, accessible for browsing regardless of session. They expose no private data or mutating actions. Future protected actions must check the current observed user before starting an operation; this phase adds no such operation.
- `/terms` reuses the current pending-content Terms screen and is reachable from Menu in either state and from registration. Move its thin route wrapper out of the guest-only auth group to prevent signed-in redirects and duplicate route paths.
- Keep `/welcome` as a compatibility redirect to `/home`; keep obsolete `/verify-phone` safe redirect behavior and no SMS operations.
- Existing Login/Register/reset flows remain separate from tabs. Login and Sign up in the guest header open their corresponding existing routes. Android Back can return to the guest Menu without signing in. A cold auth entry's Back falls back to `/menu` instead of exiting the app.
- Authentication observer success returns to an allowlisted source destination, default `/menu` for Menu auth entry. Carry `returnTo` between Login/Register/reset links and use one explicit allowlist (`/home`, `/explore`, `/properties`, `/community`, `/menu`, `/wishlist`, `/account`, `/notifications`). Reject arbitrary URLs or unknown paths. No booking intent or automatic protected operation resumes in this phase.
- Centralize the authenticated redirect in the auth-group layout, driven by observed user state. The root auth group becomes available for completed onboarding guests; its layout redirects authenticated users to the validated return destination. Do not redirect from form promise completion or duplicate session state.

## Menu behavior

- Guest header uses the generic avatar and “Hello, Guest”; Login and Sign up have independent touch targets. Hide Logout when no user is signed in.
- Signed-in header preserves the reference geometry but does not pretend the current AuthUser has a profile name/avatar: use a generic avatar and “Hello, User” until separately approved profile data exists. “Update personal info” opens the Account placeholder. Do not display Jane Doe, sample email/phone, fake profile photos or fetch a profile document.
- My Wishlist, Account, Notifications and Privacy policy navigate to their placeholders. “System Default” is reference copy, not a claim of notification permission or a working settings integration. No permission prompt/settings mutation is introduced.
- Terms opens the existing pending-content page. Do not fabricate Privacy/Terms legal content.
- Signed-in Logout invokes existing `useAuth().logout()` with pending locks and preserved root-level error/retry. Successful sign-out keeps the app usable as a guest and reveals the guest Menu. A partial/native-store failure remains actionable even if an observer removes the user.
- Footer uses the existing local logo and actual application version/build metadata, omitting unavailable build metadata. Never hardcode the Figma mock version. No new image-generation work or remote asset URLs.

## Android, accessibility and verification

Use scrollable Menu content with the real tab bar outside the scroll area, proper safe-area bottom padding,48dp minimum interaction targets, meaningful tab selected states and screen-reader labels. At320dp and enlarged text, allow wrapping/scrolling rather than clipping or shrinking text. Keep long identity values and native system insets from colliding with cards/navigation.

Meaningful tests cover startup/deep links for guest and observed signed-in states, auth-return allowlisting/Back, login/register/logout transitions, duplicate actions, sign-out failure recovery, correct destinations and persistent tab visibility. Build and inspect native Android on Diorama_API_35 Android15/API35 ARM64 (or record the actual available device). Native QA uses isolated demo data and preserves main app/session/onboarding data. No live account creation/reset/SMS, policy/billing changes or iOS testing.

## Integration and review checkpoint

Branding integration was authorized with this plan and completed at6ee4b75 on main. Execution uses `codex/main-navigation-menu` in the preserved linked worktree. Do not discard ignored Firebase config or remove this worktree. The existing Native/inline execution preference remains; design/implementation-plan review is required before product changes. This document proposes the routing/profile/guest-logout adaptations above for that review.
