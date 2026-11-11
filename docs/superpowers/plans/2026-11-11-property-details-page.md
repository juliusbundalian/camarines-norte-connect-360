# Property Details Page Implementation Plan

> For implementation, use superpowers:executing-plans task by task in the existing Properties worktree. Approved by the user on November 11, 2026, with Send Inquiry and Book Viewing deferred. Implemented in the existing Properties worktree.

**Goal** — Open a property from the list or map into the supplied details design, with a retained top bar and section navigation that follows the page's scroll position.

**Spec** — Figma file Y9XPx697YfMPFKkQzblkqc, Property Details Page frame 4053:28153, inspected in Figma Desktop on November 11, 2026. The user's additional requirements specify a white retained top bar after scrolling and a tab group that navigates the sections.

**Architecture** — Use an Expo Router stack screen and a single Animated.ScrollView for the continuous page. Keep the top bar and bottom actions outside the scrolling content. A measured section-tab row moves with its placeholder in the content until it reaches the top bar, then stays pinned beneath it.

**Tech stack** — Existing React Native Animated, Expo Router, Expo Image, React Native Maps, safe-area context, Firebase Firestore, and property theme tokens.

## Global constraints

- Display name is CamNorte 360. Geographic content covers Daet, Camarines Norte, Philippines.
- Work in /Users/juliusjervinbundalian/.codex/worktrees/auth-foundation/camarines-norte-connect-360 on codex/properties-page. Preserve the current uncommitted Properties work.
- Android is primary. Verify a native ARM64 build and Diorama_API_35 interaction checks.
- Use production Firebase for integration checks, following the user's instruction.
- Browse published property details as a guest. Protected actions use the existing authentication policy and preserve their originating property.
- Navigation pushes forward and pops backward through the shared stack options. Return to the originating list or map with its browsing state.
- Present actual record values. Figma sample names, prices, identities, and measurements are visual examples.
- Final behavior for inquiry, viewing, and wishlist actions must be settled before those actions are implemented.

## Inspected design

The frame is 412 units wide and 1580 units tall. It contains a full-width photo, white Back/Share/heart buttons over the photo, an image counter, a rounded white content surface, property type and market badges, property name, location, price, and a secondary monthly amount.

The content order is Property Details, Property Description with Read more, Amenities, Location with an embedded map, and Agent followed by Agency. The fixed bottom bar has Send Inquiry and Book Viewing buttons. The main tab bar is absent from the details frame.

Measured references include a 64-unit action header below the sample status bar, 16-unit horizontal content padding, 12-unit section padding vertically, white bg-main surfaces, bg-body separators, and the existing green primary and yellow warning colors. Use real Android safe areas and scalable layout rather than reproducing the mock device's status bar or fixed page height.

The retained white header and section-tab behavior are specified by the user. The tab labels and active styling below are proposed implementation choices because the inspected frame shows the initial page layout.

## Scroll and section navigation

- Keep Back, Share, and the heart action visible in the top bar throughout scrolling.
- At the top, the bar overlays the hero photo. As the photo scrolls past the header, animate the bar background to bg-main white and adjust Android status-bar icon contrast.
- Put a horizontally scrollable row after the property summary with Details, Description, Amenities, Location, and Agent tabs. Agent covers both the agent and agency blocks.
- Use green text and an underline for the active tab, subject to review of the proposed scrolled state.
- Keep one interactive tab row mounted as an overlay. Measure its content placeholder and animate its vertical position down from the fixed header with a clamped translateY. It follows the content before pinning and stays immediately below the top bar afterward.
- Reserve the row's measured height in the scrolling content throughout the transition. This prevents layout jumps and duplicate accessible tab controls.
- Tapping a tab smoothly scrolls to its section heading, accounting for both measured header and tab heights. Clamp the target to the scrollable range so the last section remains reachable.
- Track section positions from layout measurements. Update the active tab as the user scrolls, and keep that tab visible within the horizontal strip.
- Retain a tapped tab as active until manual scrolling or another tab tap. This also prevents short clamped pages from switching immediately to Agent after a Location tap.
- Treat the final section as active at the bottom even if its heading cannot reach the header because the remaining content is short.
- Recompute anchors after description expansion, image layout changes, font scaling, and rotation. Respect reduced-motion preferences.
- Keep the bottom action bar fixed above the system navigation area. Reserve its measured height so it cannot cover the last content.

## Data audit and readiness

A read-only production query on November 11 found two published records. Both contain name, location, market, price, amenities, photo metadata, and approximate coordinates. Danielle additionally has bedroom and bathroom counts. Neither record currently contains description, seller, agency, subdivision, lotAreaSqm, floorAreaSqm, availability, or inquiryContact. The existing Listing type and decoder support these optional fields.

The repository has one bundled cover image for each property. Existing photoCount values of 2 and 18 do not provide gallery images.

- Add a published single-property loader that reuses the existing decoder, validates the requested document ID, and distinguishes an unavailable record from a failed request.
- Retain compatibility with current records. Hide absent optional rows, and show appropriate section-level empty content where a section remains useful.
- Show zero bedrooms or bathrooms as a supplied numeric value when relevant. Distinguish zero from a missing value.
- Use the real listing price. The Figma Belle sample shows a different price from the current production listing.
- Add optional gallery URLs only when actual images are available. Use the bundled cover as the legacy fallback and derive the gallery counter from loaded images.
- Furnishing needs an explicit optional field or a confirmed mapping from the existing furnishing amenity values.
- The secondary monthly amount needs a confirmed meaning and source. Display it only when corresponding data is supplied.
- Use supplied agent, seller, and agency identities and artwork. Provide neutral identity fallbacks when artwork is absent.
- Prepare a separate reviewed data update for the optional listing content once verified values are supplied.

## File structure

- Add app/(main)/property/[id].tsx as the public details route.
- Add features/properties/PropertyDetailsScreen.tsx for loading state, page composition, and scroll coordination.
- Add features/properties/PropertyDetailsHeader.tsx for retained actions and the section-tab row.
- Add features/properties/PropertyDetailsGallery.tsx for the actual available images, paging, and counter.
- Add features/properties/PropertyDetailsSections.tsx for property facts, description, amenities, and seller blocks.
- Add features/properties/PropertyDetailsLocation.android.tsx and a platform fallback for the location preview.
- Add features/properties/property-details-navigation.ts for target-offset and active-section calculations.
- Extend features/properties/PropertyCard.tsx with an optional details action used by both list cards and map previews.
- Extend services/firebase/property-listings-service.ts with loadPublishedListing(id) and reuse its existing decoding rules.
- Extend Listing and the decoder only for confirmed new display fields.

## Task 1 — Route, reads, and entry points

- [x] Add focused service tests for a published record, missing/unpublished records, invalid IDs, legacy optional data, and request failure.
- [x] Implement loadPublishedListing(id) returning a Listing or null, using a server read and the existing published-access rules.
- [x] Add the details route with loading, retry, unavailable, and ready states. Reject stale responses after an ID change or unmount.
- [x] Open details from a list card or a map preview's main content. Keep map-marker presses opening the preview.
- [x] Isolate Close and other nested action presses so they cannot also open details.
- [x] Verify guest access, normal Back, Android hardware Back, direct links, and fallback dismissal to Properties.
- [x] Verify the originating list offset, search, filters, map viewport, and selection survive returning.

## Task 2 — Page content and fixed actions

- [x] Match the inspected frame with responsive hero imagery, rounded content, badges, prices, facts, description, amenities, location, and identity blocks.
- [x] Render the one supplied cover image with an accurate 1/1 counter and full-screen viewer. Multi-image paging awaits additional gallery assets.
- [x] Add Read more and Read less with layout remeasurement.
- [x] Keep the top bar and bottom action bar persistent with real safe-area measurements.
- [x] Render long names, long descriptions, missing images, zero-valued facts, and missing optional data without fabricated content.
- [x] Verify that the fixed footer cannot obscure the last agent or agency content.

## Task 3 — Sticky navigation and motion

- [x] Test target offsets, measured header/tab heights, short final sections, expanded descriptions, and end-of-content active selection in property-details-navigation.ts.
- [x] Implement the retained top-bar background transition with native-driven Animated values.
- [x] Implement the single measured tab row and its clamped pinned position.
- [x] Wire smooth section jumps and scroll-driven active-tab updates with interruption handling.
- [x] Keep horizontal tab navigation usable with larger text and expose selected-tab accessibility state.
- [x] Verify upward scrolling restores the initial hero/header state and that rapid tab taps settle on the last selected destination.

## Task 4 — Location and action decisions

- [x] Render a Daet location preview from the existing coordinates, using the default map colors and the property's marker.
- [x] Keep embedded map gestures from trapping page scrolling. A proposed expand action opens a focused map modal within the details page.
- [x] Handle missing coordinates with an address-based fallback.
- [x] User deferred Send Inquiry and Book Viewing. Preserve their footer layout with disabled controls at 40 percent opacity.
- [x] Defer wishlist persistence under the existing scope. Keep the decorative heart consistent with existing property cards.
- [x] Defer protected-action authentication changes alongside the deferred action workflows. Published detail browsing is available to guests.
- [x] Use native sharing with the property name, address, price, and CamNorte 360 text.

## Task 5 — Acceptance verification

- [x] Run TypeScript and the relevant Properties, service, navigation, and authentication regressions.
- [x] Run the native ARM64 Android debug build.
- [x] Test both production properties on Diorama_API_35, Android 15/API 35, in guest mode and through both list and map entry points.
- [x] Check initial appearance, transition to a white retained header, tab pinning, section jumps, manual-scroll active states, interruption, expanded description, and bottom-content reachability.
- [x] Check larger font sizes, narrow width, rotation, reduced motion, and missing optional data.
- [x] Check that returning preserves the map and list browsing state, including the stationary map behavior already fixed.
- [x] Record native evidence and any remaining limitations in docs/verification.md, then update CODEX_HANDOFF_V4.md.

## Decisions for review

Implemented the continuous page, pinned section tabs, retained white header, and focused map modal. Inquiry/viewing workflows and wishlist persistence are deferred. Missing descriptions, seller metadata, lot/floor areas, gallery photos, and the monthly amount source remain data follow-up work. Native rotation, narrow-width text scaling, section navigation, modal Back, direct-link unavailability, and list/map return checks passed. Reduced-motion preferences are covered by automated tests.
