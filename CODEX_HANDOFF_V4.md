WHO THIS IS FOR

This is the fourth continuation brief for Codex working with the owner of CamNorte 360, an Expo app for Daet, Camarines Norte, Philippines. Android is the primary platform, and the current scope is the Properties tab.

WHAT WE COVERED

The Account and guest navigation fixes reached main at e5d1ead. They let users change their avatar independently with a loading state, send signed-out Account and Wishlist users to Login with Back returning to Menu, and make Register Back return to the previous screen. The Properties work continued on codex/properties-page. The Figma list uses the supplied Danielle Luxe and Belle Luxe photos. Only the listings scroll vertically, and the filter chips scroll horizontally. A chip opens its own filter section, and the left filter button opens all sections. The sheet closes when dragged down or tapped outside. The price filter uses a histogram, two handles, and synchronized peso fields. The Android splash gap was also fixed.

The Android map follows the Figma frame named Properties - Map View. It uses default Google Maps colors, hides unrelated place pins, and shares search and filters with the list. The selected property preview slides up when opened and down when dismissed with Close or a map tap. The camera pans to center the selected pin in the visible area above the card while preserving zoom.

Follow-up changes keep the map stationary on card dismissal and remove the approximate-pin notice. Supercluster now combines nearby properties into numbered green markers, expands clusters smoothly on tap, and offers a property picker for identical coordinates or groups that cannot separate at maximum zoom. Counts respect filters. The search placeholder is now “Search properties in Daet...”.

The approved Property Details Page is implemented at app/(main)/property/[id].tsx. List cards and map previews open the public detail route. The retained top bar turns white on scroll, and the Details, Description, Amenities, Location, and Agent tabs pin beneath it. Tabs navigate sections and follow manual scrolling. Photo and location expansion use native modals. Send Inquiry and Book Viewing are visible but disabled at the user's request. Wishlist persistence remains deferred, and native sharing uses property text.

WHAT WAS CONFIRMED

Use production Firebase for testing, as the user explicitly requested. Danielle Luxe and Belle Luxe are published in the propertyListings collection of the camarines-norte-connect-360 Firebase project. The listing schema supports optional description, seller, area, availability, and inquiry contact data. Both published records have approximate coordinates. The original selected-map implementation passed TypeScript, 19 focused tests, and the native ARM64 debug build. Both listings were checked with production Firebase on Diorama_API_35, Android 15 and API 35, and a screen recording confirmed the preview and camera motion.

STILL IN PROGRESS

The Properties work is in /Users/juliusjervinbundalian/.codex/worktrees/auth-foundation/camarines-norte-connect-360 on codex/properties-page. The separate main checkout has an untracked copy of the Properties plan. Both pins are estimates near Bibirao, Daet, with locationApproximate set to true until exact lot coordinates are supplied.

The latest cluster checks passed the native ARM64 build, TypeScript, and all 31 focused tests. Android production checks verified cluster expansion, property selection, filtering, and stationary dismissal. A temporary in-memory coordinate override also verified the shared-location picker and Android Back, then was removed. Automated coverage includes 2,000 properties.

The details implementation passed TypeScript, the ARM64 debug build, and all 329 tests across 41 suites. Production Android checks covered both listings, retained chrome, section tabs, rapid taps, manual-scroll selection, list/map return, image and map modal Back, unavailable direct links, landscape, and 320 dp width at 130 percent text size. A fresh reviewer found a short-description clipping issue that was fixed with a failing-then-passing regression. Belle Luxe now has the supplied room counts, lot and floor areas, furnishing, amenities, monthly amount, agent and agency, and a description based on the mockup. Danielle Luxe still lacks optional descriptions, seller and agency details, and lot and floor areas. Each property has one actual bundled cover, so the details viewer shows 1/1. The plan and latest evidence are in docs/superpowers/plans/2026-11-11-property-details-page.md and docs/verification.md.

The map card now expands upward into details and uses its already-loaded listing while Firebase refreshes in the background. The green underline remains the active-tab style and native scroll indicators are hidden.

NEXT STEPS

Start in the Properties worktree, inspect Git status, and read AGENTS.md and docs/verification.md. The map and card implementation is in PropertyMap.android.tsx, PropertyCard.tsx, and PropertiesScreen.tsx under features/properties. Use the existing Figma design for Properties work, verify interaction changes on native Android with production Firebase, and keep the Android Maps key in local build configuration. Check both worktrees before integrating this batch when the user asks.
