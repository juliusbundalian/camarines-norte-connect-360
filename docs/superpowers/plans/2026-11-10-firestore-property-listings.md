# Firestore Property Listings Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox syntax for tracking.

**Goal:** Move Danielle Luxe and Belle Luxe from the bundled catalog into Cloud Firestore and make their verified coordinates available to a future Properties map.

**Architecture:** Read published listings through the existing Firebase client. Give the cards and filter sheet the same loaded catalog. Store named numeric coordinates in each listing document so a future map can use the same filtered results and listing IDs.

**Tech stack:** Expo, React Native, TypeScript, Firebase JavaScript SDK, Cloud Firestore Security Rules, and Firebase Local Emulator Suite.

**Spec:** This plan defines the catalog migration. See [Properties page plan](2026-11-09-properties-page.md) for the existing screen and fixture details.

## Global constraints

- CamNorte 360 covers Daet, Camarines Norte, Philippines. Preserve the existing Firebase project IDs and app configuration.
- Guests and signed-in users can browse published listings. Catalog publishing is an administrator operation.
- Keep the two supplied images bundled and preserve the current layout, default For Sale filter, search, and filter semantics. Map UI, new listings, and an admin screen are separate work.
- Verify the native Android build and device behavior before release. Production enablement, data writes, and rules deployment require separate release authorization.

## Data contract

Use `propertyListings/{listingId}`. The document ID becomes the app's `Listing.id`.

| Fields | Contract |
| --- | --- |
| `name`, `area`, `location`, `type` | Existing card and filter strings. Both listings are House & Lot in West Ville, Bibirao, Daet. |
| `description` | Optional plain-text description approved by the listing source. Store it independently of the card title. |
| `seller` | Optional object with `displayName` and `kind` (`individual` or `company`). The seller is the person or company offering the property. |
| `agency` | Optional object with `name`. The agency markets or represents the listing and may handle multiple listings. FMDC is an example value when that relationship is confirmed. |
| `subdivision` | Optional object with `name`. Keep it separate from the barangay in `location` and the display address in `area` so properties can be grouped by subdivision. |
| `lotAreaSqm`, `floorAreaSqm` | Optional positive, finite numbers in square meters. Omit each value when it is unknown or inapplicable. |
| `availability` | Optional status with one of `available`, `reserved`, `sold`, or `leased`. Omit when unconfirmed. The `published` field still controls visibility. |
| `inquiryContact` | Optional object with an approved public business `phone` or `email` (or both) and an optional `agentName`. Store these as strings. Keep private owner contact details outside the guest-readable listing document. |
| `market`, `price` | Existing market labels and a nonnegative whole-peso amount. Both are For Sale. |
| `amenities`, `bedrooms`, `bathrooms` | String array with optional nonnegative whole-number room counts. Omit unknown counts. |
| `photoKey`, `photoCount` | Asset key and the existing sample photo count. Resolve the key to the existing bundled image in the app. |
| `latitude`, `longitude` | Numeric decimal degrees or two nulls while pending. Publish verified coordinates for both seed listings. |
| `published`, `displayOrder` | Boolean visibility and numeric order for the Recommended list. Use document ID to break ties. |

A property can have both a seller and an agency, and it can belong to a subdivision independently of either. A direct sale can omit `agency`. Store these small objects on the listing for the first release. Use separate agency or subdivision collections when there is a shared directory, profile, or management workflow.

### Suggested fields

| Priority | Fields | Purpose |
| --- | --- | --- |
| When agencies supply reference codes | `listingReference` | Keep the seller's or agency's reference code for inquiries. Store it as a string, separate from the app's document ID. |
| When marketing needs them | `subdivision.phase`, `subdivision.block`, `subdivision.lot`, `turnoverStatus` | Add approved phase, block, and lot labels when the source supplies them. Track whether a unit is pre-selling, under construction, or ready for occupancy when relevant. |

Keep the current card and filters as specified in the Properties page plan. Display of inquiry contact details belongs to the future listing details or inquiry design.

| Document ID | Price | Asset key | Photo count | Amenities | Bedrooms / bathrooms | Order |
| --- | ---: | --- | ---: | --- | --- | ---: |
| `danielle-luxe` | ₱2,900,000 | `danielle-luxe` | 2 | Car Port | 3 / 1 | 1 |
| `belle-luxe` | ₱2,000,000 | `belle-luxe` | 18 | Empty array | Omitted | 2 |

The shared address does not identify two individual pin positions. Obtain a map pin or decimal coordinate pair for each listing from the listing owner or the approved property source. Confirm each location is the intended property in Daet before publishing. Keep unverified production seed records unpublished. Synthetic coordinates are for emulator tests only.

For both seed records, retain the existing display address and confirm the subdivision name, seller, agency relationship, description, areas, availability, and approved public inquiry contact with the listing source. Omit unconfirmed optional fields.

Use two named numeric fields for direct marker input. A Firestore GeoPoint is also viable for storing a pair. A geohash is useful when a later map needs server-side radius queries. The initial two-record catalog needs neither GeoPoint conversion nor a spatial index. [Firestore data types](https://firebase.google.com/docs/firestore/manage-data/data-types), [Firestore geoqueries](https://firebase.google.com/docs/firestore/solutions/geoqueries)

## Review focus

- Published listings are visible without authentication, and direct reads of unpublished listings fail.
- Guest and signed-in clients cannot create, edit, or delete catalog records. Existing profile and avatar rules still apply.
- A missing, partial, or invalid coordinate pair leaves a valid card visible and produces no pin. Invalid card data in one document does not break the catalog.
- A valid card still renders when optional metadata is missing or malformed. An unknown availability stays unspecified, and an inquiry contact needs at least one valid contact channel.
- A Firestore error presents a retry state. An empty published catalog remains empty.
- Search, the list total, and the filter sheet preview all use the same records, including after retry.

## Task 1 — Define the catalog and access rules

**Files:** Modify `firestore.rules`. Create `scripts/fixtures/property-listings.json` and `scripts/property-listings-emulator.test.mjs`. Add `test:property-listings-emulator` in `package.json`, following `test:profile-emulator`.

- [x] Copy the two records into the seed fixture with stable IDs, `published: false`, and null coordinates. Keep the fixture usable for review and as a repeatable source for emulator setup.
- [x] Add an emulator test that seeds published and unpublished variants in the local demo project, queries published documents as a guest and as a signed-in user, rejects an unfiltered query and a direct unpublished read, and rejects client create, update, and delete. Restrict privileged fixture setup to the local emulator and the existing `demo-cn360-connect` project.
- [x] Add a dedicated rule for `/propertyListings/{listingId}` that allows reads only when `resource.data.published == true` and denies client writes. Keep the reader's query constrained by `where('published', '==', true)` to match the rule. [Firestore query rules](https://firebase.google.com/docs/firestore/security/rules-query)
- [x] Run `npm run test:property-listings-emulator` and `npm run test:profile-emulator`. Both must pass.

## Task 2 — Load the catalog in Properties

**Files:** Modify `features/properties/listings.ts`, `features/properties/PropertiesScreen.tsx`, and `features/properties/PropertyFilterSheet.tsx`. Create `services/firebase/property-listings-service.ts` and `services/firebase/__tests__/property-listings-service.test.ts`. Update `features/properties/__tests__/PropertiesScreen.test.tsx` to use the service.

- [x] Define `Listing.coordinates` as `{latitude: number; longitude: number} | null`. Keep the app's image source type and move the two bundled asset references into a lookup keyed by `photoKey`.
- [x] Add optional `description`, `seller`, `agency`, `subdivision`, `lotAreaSqm`, `floorAreaSqm`, `availability`, and `inquiryContact` fields to `Listing` using the shapes above. Decode these independently of card fields and omit malformed optional values. Retain an inquiry contact only when at least one valid phone or email remains.
- [x] Implement `loadPublishedListings(): Promise<Listing[]>` using `getFirestoreDb()` from `services/firebase/client`. Read published documents, validate card fields before rendering, resolve their asset keys, and sort by `displayOrder` then document ID. Accept only finite coordinate pairs within latitude −90 to 90 and longitude −180 to 180. Normalize missing or invalid pairs to null. Geographic verification happens during publishing.
- [x] Have `PropertiesScreen` own the request, data, and loading, error, and empty states. Load once per screen mount and support an explicit retry. Ignore stale results after unmount or retry. Keep search and filters local. Pass the loaded catalog to `PropertyFilterSheet` for its preview count. Remove the production import of the hardcoded array and keep sample data as test fixtures.
- [x] Cover ordering, asset resolution, malformed records, and coordinate handling in the service tests. Include a direct sale without an agency and a subdivision listing with a seller and an agency. Verify that invalid areas, unknown availability, and a contact without a valid channel are omitted without dropping the card. In the screen tests, verify that the same loaded records drive cards and preview counts and that loading, retry, and an empty successful response stay distinct.
- [x] Run `npm run typecheck` and `npm test -- --runInBand features/properties services/firebase/__tests__/property-listings-service.test.ts`.

## Task 3 — Verify Android and prepare the release

**Files:** Record results in `docs/verification.md` and release steps in `docs/firebase-setup.md`.

- [x] Build the native Android debug app and run it on Diorama_API_35 against the seeded Firestore emulator. Verify guest and signed-in browsing, both cards and images, ordering, search, filters and preview counts, and retry after a failed initial fetch. Record the device and API level.
- [ ] Once the production release is authorized and each property pin is verified, check the target project and existing documents, deploy the catalog rules, and publish the two records under their fixed IDs before releasing the client change. Use authorized Firebase Console access for the two records. Review existing values before any update to avoid overwriting edits on reruns. Confirm the production published query returns exactly the intended seed records with the verified coordinates.
- [ ] For the later map implementation, use the same filtered listings. Use `Listing.id` as the marker key and render a marker only for listings with valid coordinates. Define the map screen and marker behavior in the map's own plan.
