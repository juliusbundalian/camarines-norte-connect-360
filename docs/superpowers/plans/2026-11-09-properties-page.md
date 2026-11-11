# Properties Page Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline implementation, or superpowers:subagent-driven-development if selected. Steps use checkbox syntax for tracking. Approved for inline implementation.

**Goal:** Replace the Properties tab placeholder with the Figma listing page and working filters over the two supplied sample listings.

**Architecture:** Keep the existing Expo Router tab and render a screen-local Properties feature. Separate the fixed header, horizontal chip strip, and results toolbar from the vertical listing viewport. Use one filter sheet with a draft state separate from the applied filters.

**Tech Stack:** React Native, Expo Router, TypeScript, Expo Image, existing Poppins fonts, theme tokens and icons, and a native modal for the sheet.

**Spec:** The design and interaction contract below plus the inspected Figma references.

## Design and interaction contract

- [Properties frame](https://www.figma.com/design/Y9XPx697YfMPFKkQzblkqc/Rewards-Appv--Copy-?node-id=4050-26632) shows search by area or building, a map affordance, horizontal filter chips, a count and Recommended row, and stacked cards. Keep the existing tab bar fixed. Keep the search, chip strip, and results toolbar fixed vertically. Only the card viewport scrolls vertically on the page.
- [Active filter strip](https://www.figma.com/design/Y9XPx697YfMPFKkQzblkqc/Rewards-Appv--Copy-?node-id=4059-36095) shows an active filter dot, green selected chips, an Amenities count badge, and Clear All. The horizontal strip contains the filter icon, For Sale/For Rent, Property Type, Price, Amenities, Location, and conditional Clear All. Active styling follows applied values.
- [Bottom Sheet - Properties Filter](https://www.figma.com/design/Y9XPx697YfMPFKkQzblkqc/Rewards-Appv--Copy-?node-id=4057-35828) is the source for the sheet. It shows a drag handle, Filter title, For Rent/For Sale toggle, property type options, minimum and maximum price inputs, amenities, Daet locations with See more, and a footer with Reset and Show results. The neighboring Filter mock includes event options, so use the sheet labeled for Properties.
- Danielle Luxe uses the uploaded 356 × 200 `danielle_luxe.png` and the Figma price ₱2,900,000. Belle Luxe uses the uploaded 356 × 200 `belle_luxe.png` and the Figma price ₱2,000,000. Both are sample House & Lot listings in West Ville, Bibirao, Daet. Preserve the imagery, card styling, and supplied sample labels. Photo badges are visual sample metadata. No gallery is in scope.
- Sheet behavior. the filter icon opens the full sheet, and each named chip opens a sheet with only its corresponding controls. Reset restores the displayed filters to their defaults. Show results applies the draft, updates the cards and chip states, and dismisses. Dismissing without applying discards the draft. Clear All resets applied filters in one tap, leaving the search query intact. For Sale is the default. The default sale label starts neutral. Explicitly applying either market activates its chip.
- Fixture behavior. search matches listing name or area/building text and combines with the applied filters. Display the real local result count in both places where the mock shows 999+ or 99+. Keep Recommended as the initial ordering. Add House & Lot and Bibirao as filter options so the displayed samples can be found using their actual card type and location. Only assign amenities supported by the sample cards. Show a clear empty state for valid combinations that match no fixtures.
- Map, heart, and Recommended affordances are visual for this phase. A map view, property details, gallery, viewing requests, Wishlist writes, and any new sort modes or backend remain outside this page's scope.

## Global constraints

- Use the name CamNorte 360 and keep all fixtures and locations within Daet, Camarines Norte, Philippines.
- Keep Properties browseable for guests and signed-in users within the existing five-tab shell.
- Use the exact supplied photos. The verified source files are `~/Downloads/danielle_luxe.png` and `~/Downloads/belle_luxe.png`. Copy them into the repository during implementation.
- Figma's Starter quota blocked connector metadata and high-fidelity design context. The three references were inspected in Figma desktop. The design-context retry returned the same quota response. The approved desktop references supplied the visual measurements.
- Validate the native Android build and installed screen. Document the Android device/API and any unverified behavior.

## Review focus

- Vertical list gestures must leave the search, chip strip, toolbar, and tab bar in place.
- Horizontal chip gestures must reach Location and Clear All without moving the cards vertically.
- A dismissed sheet must not commit a draft. Reopening should start from applied filters.
- Blank price bounds are open-ended. Invalid or inverted bounds show a form-level error only after Show results.
- A small display, large text, and the Android keyboard must leave the sheet footer reachable. An empty result set must leave search and filter controls usable.

### Task 1: Replace the Properties placeholder with the fixed header and listing viewport

**Files:** Modify `app/(main)/(tabs)/properties.tsx`. Create `features/properties/PropertiesScreen.tsx`, `features/properties/PropertyCard.tsx`, `features/properties/listings.ts`, and the two PNGs under `assets/properties/`.

- [x] Confirm the desktop frame or connector measurements for the search row, toolbar, and cards. Copy the photos and confirm each maps to its matching card.
- [x] Add the two typed local listing fixtures and render the Figma card content with existing fonts and Expo Image. Use the existing tab bar.
- [x] Render the fixed header, horizontal chip strip and toolbar as siblings of a bounded vertical FlatList. Confirm both cards can be reached without vertical movement of the fixed regions.

### Task 2: Wire search, filter chips, and the Properties sheet

**Files:** Create `features/properties/PropertyFilterSheet.tsx` and `features/properties/property-filters.ts`. Modify `features/properties/PropertiesScreen.tsx`. Add focused coverage under `features/properties/__tests__/` for filter behavior.

- [x] Add focused tests for composed filters, open-ended and inverted price bounds, draft cancellation, and Clear All. Run the new tests against the initial screen and confirm that the missing behavior fails.
- [x] Add the applied filters and draft sheet state. Render all sections for the filter icon and just the relevant section for an individual chip. Keep its footer reachable when the body scrolls or the keyboard opens.
- [x] Wire local search, result counts, the empty state, and active chip styling. Verify Reset, Show results, Clear All, and Android Back against the state contract.
- [x] Run the focused tests, TypeScript, and existing Jest suite. Verify that the shared tab shell and other routes still pass their existing tests.

### Task 3: Verify the requested page on Android

**Files:** Add results to `docs/verification.md`.

- [x] Build and install the native ARM64 Android debug app. Record the emulator/API level and compare the default listing, active chips, and sheet against the Figma references.
- [x] Check vertical and horizontal gestures independently. Exercise the full sheet and individual chip entry points, draft dismissal via Android Back, apply/reset/clear, local search, and a no-results case.
- [x] Check a compact viewport with large text and the numeric keyboard. Verify the sheet footer remains reachable and the uploaded photos retain their intended proportions.

## Implementation notes

The 412 × 892 desktop reference shows 16 dp page gutters, a 48 dp search row, 32 dp filter chips, 380 dp cards, and 356 × 200 photo slots. The two local photos match the supplied files byte for byte. The sheet renders just the selected section for an individual chip. At compact width with large text, Android height adjustment lifts the footer above the numeric keyboard.
