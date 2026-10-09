---
version: 1
slug: "frontend-src-pages-home-homepage-tsx"
primary_target: "frontend/src/pages/Home/HomePage.tsx"
related_targets: ["frontend/src/pages/Home/home.css","frontend/src/pages/Home/homeContent.ts"]
---

# Homepage — photographic service discovery

Mode: Persuade. Extend the existing NVT homepage, limited to the two sections identified in the user's screenshots: service links and the closing tour action. The user confirmed short descriptions, photographs and breathing room. Implement directly in the inherited world; no new identity, concept tournament or generated comp.

## Direction contract

THESIS: Replace the text-only service directory and empty closing strip with real photographic reasons to travel. Refuse four identical boxed cards: a tall tour photograph leads, a wide hotel photograph and compact food composition support it, then a landscape planning link completes the choices.

OWN-WORLD: Preserve forest green, warm paper, EuclidSquare, restrained SVG arrows and square-edged photographs. No new font, decorative gradient, badges, stock claims or invented inventory. Captions identify actual subjects; the food image illustrates cuisine, not a particular restaurant.

STORY: Choose a tour, a place to stay or a meal; arrange the rest in a personal itinerary. Short practical descriptions and visible action labels connect each photograph to the existing route. Close on Tràng An scenery with a clear invitation to explore tours.

FIRST VIEWPORT: The edge-to-edge opening hero, green header, numeric 1–2–3 slide controls and pause behavior are untouched. In the changed service viewport, a compact two-column introduction sits above an asymmetric image-led composition, with text under—not competing over—the imagery. The final banner is a broad landscape paired with a cream action panel.

FORM: A scoped extension, seed not applicable. Tour occupies the tall left column, hotel the upper right, food a smaller right-hand image/text row; planning spans below with an image, short copy and labelled action. Below 760px this becomes a single-column reading path. The hero crossfade remains the single authored motion; service hover changes underline/color, not photo zoom. Use lazy images, resilient alt/fallback, focus and 44px actions.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

This inherited-system extension does not create/replace global DESIGN.md or repair stale PRODUCT.md decisions. Finish with a scoped comparison report, source attribution and a fresh finish review. Existing rasters retain provenance; the new Commons dining image adds source/license metadata and visible credit without any SQL changes.

## Finish verification — 2026-10-08

Fresh finish reviewer: `ship`, no material fixes, after opening 30 valid captures at 1440/1901/820/390/320px. TYPE/MATERIAL/GROUND/THESIS/STORY/FIRST VIEWPORT match; tablet/mobile form adaptation is valid. Review: `.impeccable/review/home-photo-20261008/finish-review.md`. Scoped system comparison, source provenance, passing checks, existing lint warnings and verification limits: `docs/HOME_PHOTO_SECTIONS_2026-10-08.md`. This closes documentation for the ordinary extension without creating or changing a global visual system. The verdict covers the two changed sections, not the whole application.

## Closing-photo inset follow-up — 2026-10-09

The user requested a small breathing margin around the Tràng An closing photograph, not a redesign. `home.css` now pads the closing section with the inherited `--home-gutter` horizontally and 24–48px vertically; the background remains full width. Mobile caption/body padding avoids doubling this outer inset. Content, photos, routes, hero and interactions are unchanged.

Build passed (existing large-bundle warning retained). Both GET-only homepage suites passed; photo insets measured 75.8/57.6/32.8/24/20px at 1894/1440/820/390/320px, with no horizontal overflow or JavaScript errors and unchanged 56px/44px actions. Ten native/full-section captures were inspected in `.impeccable/review/cta-inset-20261009/`; a single final detector on `home.css` returned `[]`. Verification is local Chromium, not a cross-browser audit. No SQL/API or raster changes.

## Transparent header and six banners — 2026-10-09

New explicit user refinement supersedes the earlier FIRST VIEWPORT preservation rule only for the header/hero controls. Keep the existing NVT forest/cream system and photo-led sections. At the top of `/`, the header is transparent over the fullscreen photograph; beyond 40px it becomes green again. Other pages stay green. Remove the entire “Bạn muốn đi đâu?” strip, not just its title. “Khám phá tiếp” now scrolls/focuses the story heading.

Add three existing real photographs to the original three: Tràng An, Mù Cang Chải and Eo Gió, with their verified public destination links and exact local author/license/source metadata. No media downloads or database writes. Six numeric selectors preserve the user's preference; mobile places all six numbers above a second row of previous/next/pause buttons. Targets remain 44px and DOM/tab order follows visual order. Autoplay, crossfade, pause, hold, reduced motion and retries are unchanged.

The existing functional scrim is strengthened around transparent-header text and compact/short-screen titles; the photograph still shows through and its central subject remains visible. Batched review found two contrast defects; one correction and one confirmation resolved them. Final sampled login contrast is 7.35–7.70:1, motto including its 85% opacity 5.69–5.76:1, compact Eo Gió heading 6.41:1 white / 4.56:1 cream. Samples are adjacent background locations, not a complete pixel-mask contrast audit.

Build passed with the incumbent bundle-size warning. `tests/home-hero-refresh.mjs` passed 11 GET-only groups (1898/1440/820/390/320px and 820×390) plus the existing fullscreen/photo-section suites (six/seven groups). Hero checks passed again after the contrast correction. Final native captures: `.impeccable/review/hero-refresh-20261009/` (18 images); scrolled evidence waits for the color transition to finish. Reviewer verdict: ship for this refinement. A single final detector on HomePage/home.css/homeContent/experience.css returned `[]`. No JavaScript errors or API mutations in scoped checks. Verification is local Chromium and anonymous customer flows; authenticated-admin behavior is unchanged by source inspection, not freshly tested. No global identity changes or Git push.
