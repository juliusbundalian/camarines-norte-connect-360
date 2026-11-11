# Properties Map Implementation Plan

> For implementation, use Superpowers executing-plans. Check off each task once verified.

**Goal** — Let guests and signed-in users see the properties that match their current search and filters as pins on a map of Daet.

**Architecture** — The existing map icon switches Properties between list and map views. Both views use the same filtered Firestore results. The Android map uses `react-native-maps` with Google Maps.

**Spec** — This plan defines the first map view and builds on the [Firestore catalog plan](2026-11-10-firestore-property-listings.md).

**Visual reference** — [Properties - Map View](https://www.figma.com/design/Y9XPx697YfMPFKkQzblkqc/Rewards-Appv--Copy-?node-id=4072-3781). The grayscale map replaces the results toolbar and cards. White house and apartment pins sit on the map, with a yellow list button beside search.

## Options

| Option | Setup and fit |
| --- | --- |
| `react-native-maps` with Google Maps | Recommended for an in-app map. Expo SDK 58 specifies a compatible package version. The library provides markers, callouts, and camera fitting. A native Android build needs the Maps SDK for Android enabled, a billing-enabled Google Cloud project, and a restricted Android API key. [Expo SDK 58 setup](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/), [Google Maps SDK setup](https://developers.google.com/maps/documentation/android-sdk/get-api-key) |
| `expo-maps` | Also uses Google Maps on Android and needs the same Google Cloud setup. A reasonable option if the project prefers Expo's map API and Apple's map provider on iOS. [Expo Maps SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/maps/) |
| MapLibre | Supports an in-app map with a different map provider. Production setup includes choosing and configuring a style and tile source. [MapLibre React Native setup](https://maplibre.org/maplibre-react-native/docs/setup/getting-started/) |
| Google Maps link | The simplest way to open an individual property's location. A Maps URL needs no API key and opens Google Maps or a browser. It leaves the in-app list and does not show all filtered listings together. [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) |

## Scope

- Android first. Preserve the list on web and iOS and defer their map implementations.
- Start with a pan-and-zoom map and one pin per listing with verified coordinates. Tapping a pin shows the listing name and formatted price.
- Keep the search field and filter chips available in map mode. Switching views preserves search and filters. Android Back from the map returns to the list.
- Keep the first version focused on viewing properties. Device location, routing, geocoding, radius searches, and clustering can be evaluated separately.

## Task 1 — Configure the Android map

**Files** — `package.json`, the lockfile, `app.config.ts`, and `.env.example`.

- [x] Confirm the Google Cloud project and billing setup with the project owner. Enable Maps SDK for Android when authorized. Restrict the map key to that SDK and to the Android package and signing SHA-1 actually used by each build. The default package is `ph.cn360connect.app`. Use the debug certificate for local QA and the Play signing certificate for Play-distributed builds. [Google API key restrictions](https://developers.google.com/maps/documentation/android-sdk/get-api-key)
- [x] Install with `npx expo install react-native-maps`. Wire `GOOGLE_MAPS_ANDROID_API_KEY` into `androidGoogleMapsApiKey` through the plugin. Keep the key value in local or build configuration and add a placeholder to `.env.example`. Expose only a boolean configuration flag to JavaScript so builds without a key can keep the list usable.
- [x] Rebuild the native Android app and confirm the Google basemap renders on an emulator image with Google Play services.

## Task 2 — Show filtered property pins

**Files** — `features/properties/PropertiesScreen.tsx` and a platform-specific `features/properties/PropertyMap.android.tsx`. Keep native map imports out of the other platform entry points.

- [x] Turn the existing icon into an accessible Map/List toggle on configured Android builds. Keep the list as the default view and handle Android Back from map mode.
- [x] Pass the existing filtered results to the map. Select only listings with valid coordinates and use each listing's Firestore ID as the marker key. Reuse the existing price formatter for the marker callout.
- [x] Center on a single pin or fit multiple pins with padding after the map is ready. Keep the camera stable during ordinary panning and refit when the filtered pin set changes.
- [x] Distinguish zero search or filter matches from matches with no pins. For the latter, show “Locations aren’t available for these properties yet” with a way back to the list. Preserve the catalog's existing loading, error, and retry behavior.

## Task 3 — Verify with the live catalog

**Files** — Record device and result in `docs/verification.md`.

- [x] Check the empty pin state on Android using the current production Firestore documents. Both published listings currently have null coordinates.
- [ ] Obtain verified coordinates for Danielle Luxe and Belle Luxe before the live pin check. With authorization to update those records, add the approved coordinates to production Firestore.
- [ ] On a native Android build using production Firestore, verify guest access, two pins, marker name and price, search or filters reducing the pin set, and a return to the list with the same filters. Run TypeScript and focused Properties tests. Record which Android device and API level were used.
