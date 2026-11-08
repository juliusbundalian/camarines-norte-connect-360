# Post-registration onboarding: Figma inspection

Status: research only; product decisions and design approval pending. No implementation authorized by this document.

Inspected in the Figma desktop application on 2026-11-08. File `Y9XPx697YfMPFKkQzblkqc`, CamNorteConnect page, Authentication Flow section. Measurements below are from the visible Design inspector unless explicitly described as visual observations.

## Requested frames

| Frame | Node | Observed behavior and content |
| --- | --- | --- |
| Account Registered | `4005:15157` | Modal over dimmed registration form; heading “Account Registered”; body “Your account creation is complete. You’ll be redirected to the home page shortly.”; “Redirecting in 3s”. Diagram arrow leads to sex instead of Home. Underlying legacy phone registration must not replace current email registration. |
| sex | `4005:15274` | “1 of 2”, half-complete green progress; “Tell us about yourself”; “To enhance your experience, please share your gender”; vertically stacked circular Male, Female, Other choices; Male shown selected green, others gray; Back and fixed bottom Next. No visible skip. |
| Avatar 1 | `4005:15321` | “2 of 2”; “Complete Your Profile”; “Fill up the form below for us to know you better”; female avatar and green edit control; Name, Birthdate with calendar and MM/DD/YYYY hint, optional Mobile Number with +63 prefix; bottom Finish. Annotation specifies this default picture for Female. |
| Avatar 2 | `4005:15351` | Same profile form with male avatar; annotation specifies default for Male. Counter says “3 of 3”, date sample uses long month format without Avatar 1's format hint. This appears to be an alternate profile state, not an additional step. |
| Avatar selection | `4005:15371` | Dimmed profile background, centered white “Select Avatar” modal, nine circular illustrations in a 3×3 grid, yellow Done button. Background counter says “3 of 3” and Finish appears green, unlike the yellow Finish on profile frames. No visible Cancel or selected-avatar indicator. |

## Inspector measurements captured

- Screen frames: 412 × 892; background token Light/Background/bg-body = `#F5F5F9`.
- Avatar picker Modal `4005:15392`: 380 × 510, x16/y191 within the screen; white fill; horizontal padding24, vertical padding32, vertical content gap24, corner token16.
- Picker title `4005:15393`: Mobile/display/headline/small, 24/32; text-primary `#22303E` at90%.
- Picker grid `4005:15394`: 318 × 318, 3 columns ×3 rows, row and column gaps24, no internal padding.
- Picker avatar component: 90 ×90, clipped/circular; background primary `#39B54A` at16%.
- Visual proportions: profile avatar is larger than picker avatars; gray rounded Back control, centered headings, green progress, white bottom action surface, yellow primary actions. Exact remaining layer metrics must be captured during implementation before styling those layers.

## Local assets and current integration

- Nine valid SVGs now exist in `assets/avatars/Avatar-1.svg` through `Avatar-9.svg`; each has width90, height90, viewBox `0 0 90 90`. The ninth was supplied after the initial inspection. They remain untracked following the preceding integration's explicit exclusion; inclusion belongs to the approved onboarding implementation.
- Active branch is `codex/post-registration-onboarding`, based on the integrated Menu/logout work.
- Current registration calls Firebase create-user and signs in immediately. `app/(auth)/_layout.tsx` redirects any observed signed-in user, so success presentation/profile setup cannot be added safely by only appending screens to registration.
- AuthUser contains uid/email/phoneNumber only. There is no profile persistence contract, Firestore rules, or Firestore emulator configuration in the repository. Native and JS auth compatibility must be respected by any profile persistence choice.
- Existing generic Menu identity can eventually consume the saved name/avatar if included in the approved design; account editing is not implicitly authorized.

## Open decisions

User confirmed: ninth supplied; normalize to two steps and correct success copy; required, Firebase-backed, resumable setup while existing accounts sign in normally; required gender/name/nonfuture valid birthdate, optional validated Philippine mobile, no minimum age.

Implementer proposals for Other defaults, Back/exit, picker draft/Done/dismiss, Menu identity, existing-account compatibility and interrupted-registration recovery are recorded in `2026-11-08-post-registration-onboarding-design.md` for user approval. Home after Finish is confirmed; Enable Location is outside this phase.

## Constraints for the subsequent plan

Keep CamNorte 360 branding, Daet-only coverage, technical identifiers, existing sessions, guest browsing, and current approved modules. No SMS or email verification. Optional contact phone is profile data only unless explicitly approved otherwise. Form errors appear only in alerts after submit, never inline or on typing/blur. Do not treat supplied sample names/dates as prefilled user data. Verify native Android behavior, keyboard/date-picker/Back interactions, process restart, save failures, duplicate taps, compact layouts and text scaling during implementation; record device/API. Planning alone does not establish implementation or Android verification.

Implementation inspection: Account Registered Modal380×192, x16/y350, horizontal padding24/vertical32, overall gap16 and title/body group gap8. Title24/32, letter-spacing-1px. Its bound Static/Headline Small/Font variable was inspected in the picker and resolves to Poppins; plain font also resolves to Poppins, emphasized weight Medium. Use bundled Poppins for this modal rather than inheriting Public Sans from email registration.
