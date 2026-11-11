# Privacy Policy and Terms & Conditions Implementation Plan

> For implementation, use Superpowers executing-plans on the legal-pages branch.

**Goal** — Replace the existing legal placeholders with two readable native documents based on the supplied Figma frames and the reviewed CamNorte 360 drafts.

**Architecture** — Share one legal document screen, with a fixed white app bar and one vertically scrollable body. Keep the text and version metadata separate from the screen.

**Tech stack** — Expo Router, React Native, safe area context, and the existing Poppins fonts and theme tokens.

**Drafts** — [Privacy Policy](../../legal/privacy-policy.md) and [Terms & Conditions](../../legal/terms-and-conditions.md).

## Design reference

- [Terms & Conditions](https://www.figma.com/design/Y9XPx697YfMPFKkQzblkqc/Rewards-Appv--Copy-?node-id=4099-27605) and [Privacy Policy](https://www.figma.com/design/Y9XPx697YfMPFKkQzblkqc/Rewards-Appv--Copy-?node-id=4099-27585), inspected in Figma Desktop. Both frames are 412 × 892 design units.
- Use the white app bar, leading Back arrow, light background, 16 dp content inset, document title, publication/effective date rows, and numbered headings. The app bar stays visible as the body scrolls. Respect real system insets.
- Use Poppins Medium for titles and section headings and Poppins Regular for body copy and dates. Start with existing 24/32 document title, 16/24 heading and 14/20 body tokens, with wrapping and system text scaling. Compare with the frames at the reference width.
- Use the mockup as a layout reference. Replace EarnPH and sample service descriptions with the drafts. Keep the operator, contact details, dates, and unconfirmed operating practices as review placeholders.

## Task 1 — Shared legal reader

- [x] Add `features/legal/LegalDocumentScreen.tsx` with a document title, optional publication/effective dates, sections, and links. Use a white fixed header with a 48 dp Back target and a single safe-area-aware ScrollView.
- [x] Add `features/legal/legal-documents.ts` with structured content based on the two drafts. Show a draft label while placeholders remain. Use semantic headings, accessible links and text that wraps at larger font sizes.
- [x] Keep the Google Maps terms and Google Privacy Policy links in Terms, and the Firebase, Google and NPC privacy links in Privacy Policy.
- [x] Verify title, section order, date placeholders, link behavior and reachability of the final section.

## Task 2 — Route entry and Back

- [x] Update `app/terms.tsx` to render the shared reader with the existing Poppins font loader. Retire the old pending-content Terms component once its callers are migrated.
- [x] Move `app/(main)/privacy-policy.tsx` to `app/privacy-policy.tsx` so it can share the root-level accessibility of Terms. Preserve the existing `/privacy-policy` URL and Menu link. Use the existing Terms route guard for both pages and keep required profile setup protected.
- [x] Link Terms to Privacy Policy within the app. Keep the existing registration Terms link and form behavior. Returning from Terms should restore the registration inputs and checkbox state.
- [x] Use actual route history for toolbar and Android Back, with the existing Menu fallback for a direct entry without history. Check guest Menu, signed-in Menu, registration, and Terms-to-Privacy navigation.

## Task 3 — Android verification

- [x] Run TypeScript and focused navigation/document tests, then the native ARM64 debug build.
- [x] On Android 15/API 35, compare both pages with the Figma layout. Scroll to the final paragraph, verify that the header remains fixed, and check external links and toolbar/hardware Back.
- [x] Check a narrow viewport and enlarged text. Verify that the app bar title, dates, and long paragraphs wrap without clipping.
- [x] Record the verified device and checks in `docs/verification.md`.

## Publication details to fill in

Use placeholders during draft review as requested. Before treating these as final documents, replace them with the operator name, mailing address, public privacy and support contacts, actual publication and effective dates, and confirmed retention and deletion practices. Confirm the purposes and legal bases for profile fields, handling of younger users, any processing outside the Philippines, and how material updates will be communicated. The current app has no account-deletion screen, so the draft describes a contact route and leaves the operating process for confirmation. Publication and any change to how Terms acceptance is recorded are separate from this page plan.

The draft is informed by the [Philippine Data Privacy Act implementing rules](https://privacy.gov.ph/implementing-rules%20regulations-data-privacy-act-2012/), [NPC data subject rights](https://privacy.gov.ph/data-subject-rights/), [Firebase privacy information](https://firebase.google.com/support/privacy), and [Google Maps Platform terms, section 3.2.2](https://cloud.google.com/maps-platform/terms).
