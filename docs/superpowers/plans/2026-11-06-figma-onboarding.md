# Figma Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the three temporary onboarding pages with the supplied Figma design, matching its reference layout as closely as possible on Android.

**Architecture:** Retain the onboarding provider, completion storage key, route guards, and measured-width horizontal paging. Separate the visual page from pager behavior; use local Figma assets, scoped design tokens, and bundled Poppins fonts. Implement with the project's existing React Native components and StyleSheet conventions.

**Tech Stack:** Expo, strict TypeScript, React Native Paper, Expo Image, Expo Font, Jest/RNTL; Android native build and ADB/UIAutomator verification.

**Spec:** User-approved visual target: [CamNorteConnect onboarding](https://www.figma.com/design/Y9XPx697YfMPFKkQzblkqc/Rewards-Appv--Copy-?node-id=4004-13065), frames `4004:13065`, `4004:13083`, `4004:13101`. Existing functional requirements: `docs/superpowers/specs/2026-11-04-auth-foundation-design.md`. High-fidelity design context and screenshots for all three frames were inspected on 2026-11-06.

Branding/scope amendment2026-11-08: the copy below now reflects CamNorte 360 and Daet-only coverage, superseding the original province-wide Figma wording. Layout, assets, behavior and existing technical identifiers remain unchanged.

## Global Constraints

- Implement the three onboarding pages only; Finish/Skip retain completion persistence and continue to the existing Login flow. Do not add location permissions, Home, registration/profile redesigns, OTP, or other modules shown elsewhere in the Figma file.
- Reference frames are 412×892, including a 52px status-bar mockup and 24px navigation-bar mockup. Use real Android system bars; do not paint fake clock, signal, camera cutout, device frame, or gesture handle.
- Use the user-supplied `image 90.png`, the exact white wave SVG and page-indicator SVG variants as local assets. User amendment: use Lucide TreePalm, House and Users icons for pages1–3 instead of the Figma search icon. Do not redraw the curve. No temporary Figma URLs at runtime.
- Poppins Medium: headings 28/36, tracking 0; next/finish 16/24, tracking 0.5. Poppins Regular: descriptions/Skip 16/24, tracking 0.5.
- White panel; heading rgba(34,48,62,0.9), description rgba(34,48,62,0.7), Skip rgba(34,48,62,0.4), action #FFAB00, badge #39B54A. Scope these tokens to onboarding; retain other screen styling.
- At reference size: photo frame x=-33,y=0,w=445,h=594; wave x=0,y=556.303,w=412,h=41.697; white body y=598,h=270; horizontal content padding32; title y=614; body gap8; action text row y=774; badge x=32,y=542,size64,border8,radius12.
- Page 1: `Discover\nDaet, Camarines Norte`; `Explore beaches, heritage sites, & hidden gems in Daet, Camarines Norte`.
- Page 2: `Explore Property Opportunities`; `Find homes, lots, & investment properties in Daet, Camarines Norte`.
- Page 3: `Stay Connected \nwith the Community`; `Get updates from Daet, join local events, & share your voice through surveys & feedbacks`.
- Controls follow Figma: Skip/Next on pages1–2, Finish on page3 with Skip hidden. Preserve backward navigation through reverse swipe and Android Back, avoiding an extra visible Back button absent from Figma. Finish fulfills the original temporary Get Started action.
- Keep at least48dp touch areas around the24px text row without moving its visual baseline. Keep pending/error/retry feedback functional. Do not mark Skip disabled merely because its design color uses the disabled-text token.
- Fit other sizes with responsive geometry and actual safe-area insets; use scrolling when landscape or enlarged text cannot fit. Never shrink accessible text to force a screenshot match.
- Android first. Preserve live account/application data during QA; use a disposable QA package for clean-onboarding tests. No merge/push.

## Review Focus

1. Narrow or enlarged-text layouts: all copy and completion controls remain reachable without overlap.
2. Rotation after page2: measured pager realigns to page2 after content layout.
3. Save failure or duplicate taps: no false completion, usable retry, single pending write.
4. Inactive pages: assistive technology exposes only the selected page; hidden Skip is not focusable.
5. Asset/font accuracy: local assets nonempty, correct SVG slots/proportions, Poppins regular/medium actually rendered; native system bars are the only intended platform differences.

### Task 1: Local assets, exact page presentation, and preserved interactions

**Files:** Create `assets/onboarding/` (photo, wave, three pagination assets), `assets/fonts/` (Poppins Regular/Medium and license), `theme/onboarding.ts`, `features/onboarding/OnboardingPage.tsx`. Modify `features/onboarding/content.ts`, `features/onboarding/OnboardingScreen.tsx`, its tests, `app.config.ts`, `package.json`/lockfile. Add focused page tests if needed.

**Interfaces:** `OnboardingPage` accepts page content, measured width/available height and selected state. `OnboardingScreen` remains the route-facing default export and calls the existing `useOnboarding().complete()`; the provider and storage key are unchanged. Use Expo-compatible `expo-font` to bundle the two local font faces; load them before rendering styled copy, with an explicit loading/failure path and no artificial delay.

- [x] Download the assets by curl as instructed in the high-fidelity Figma context. Obtain Poppins font files/license from the official Google Fonts repository. Validate dimensions, asset slots, and license; keep screenshots as reference evidence, never implementation assets.
- [x] Adapt existing tests first: exact Figma text, Next/Finish and hidden final Skip, reverse paging/Android Back,48dp targets, saving/error/retry, active-page accessibility. Preserve real measured-width/content-size rotation assertions. Observe expected failures against the temporary layout.
- [x] Implement scoped tokens and reusable page layout from the measured properties above. Use Expo Image for static imagery/SVGs and Paper text/actions where configurable; retain pager, provider, and route boundaries.
- [x] Run focused tests, full `npm test -- --runInBand`, `npm run typecheck`, and Expo compatibility checks. Fix failures and record red/green evidence. Commit the implementation after verification.

### Task 2: Android visual comparison and acceptance review

**Files:** Update `docs/verification.md`, this plan's checkboxes; add safe onboarding-only comparison screenshots under `docs/screenshots/` if useful.

**Interfaces:** Uses Task1's finished route. QA package is isolated from `ph.cn360connect.app`; no live account resets, new live users, or real reset messages are needed.

- [x] Build/install native Android. Match emulator viewport to412×892dp where available, record real system insets, and compare all three pages with Figma. Check image crop, wave placement, badge, line breaks, fonts, dots, colors and control baselines; correct every in-scope mismatch and repeat affected screenshots.
- [x] Exercise forward/reverse swipes, Next, Android Back, Skip/Finish, cold-launch onboarding persistence, active-page rotation, and320dp/200%-text scrolling. Verify loading/errors/duplicate completion with appropriate automated tests; distinguish native from unit evidence.
- [x] Run final full Jest, TypeScript, Expo Doctor, Android export, and native build as appropriate to changes. Use one fresh independent reviewer per the preserved Native workflow; resolve substantive findings, then record exact results/limitations.
- [x] Restore temporary device settings, uninstall only the QA package, stop owned QA processes, preserve the live app/session, and commit final evidence. Stop at onboarding; no merge/push or additional modules.

## Self-review and checkpoint

The plan covers every visible layer of the three supplied onboarding frames and retains completion/persistence/navigation from the approved foundation. Native system UI and accessible reflow are explicit adaptations. Figma contains no functional Skip/Finish prototype reactions, so the existing completion behavior supplies those actions; the only explicit Next reaction connects page1 to page2. Location and Home arrows are outside this change.

Execution method remains **Native**, as previously selected by the user. Approved by the user on2026-11-06 with supplied-photo/Lucide-icon amendment; proceed using Native execution.

Completed2026-11-06. Both tasks verified; native visual/rotation/font-scale findings resolved and independently reviewed. See `docs/verification.md` and the Android screenshot overview for evidence and device limits. No merge/push; additional screens await their own approved scope.
