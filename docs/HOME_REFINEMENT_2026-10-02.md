# Homepage refinement — 2026-10-02

## Scope and comparison

The finished homepage follows the approved fullscreen photographic refinement in `docs/HOME_SURFACE_2026-10-02.md` and `.impeccable/surfaces/frontend-src-pages-home-homepage-tsx.md`. It extends the incumbent NVT identity documented by `docs/UI_CONTEXT.md`, `PRODUCT.md`, `frontend/src/index.css` and `frontend/src/experience.css`. It does not establish a replacement visual system.

The user approved direct implementation without mockups for this turn. The global `.impeccable/config.json` remains `buildPath: comp`. The missing root `DESIGN.md` and the older mockup approval statement in `PRODUCT.md` are pre-existing documentation drift, recorded here without changing global design or product authority.

## Five-line system comparison

1. Palette: warm paper (`#f1efdf`), forest ink (`#284b41`) and pale surface (`#fffef8`) remain inherited; homepage muted copy uses `#56685b`, and the photographic destination section uses `#294e43`.
2. Typography: locally loaded EuclidSquare remains the sole designed family with Arial/sans-serif fallbacks; body is 16px/1.65, desktop hero 56–96px at weight 300, mobile hero 40–58px, and section headings approximately 32–60px at weight 400.
3. Photographic scale: an edge-to-edge hero has a minimum dynamic viewport height; content can grow on short screens. A legibility scrim, slow crossfade and credited real photographs support the composition.
4. Open composition: square photographic edges, thin dividers, service rows and an asymmetric destination gallery replace the homepage's crowded control/card treatment; small 3px button corners are local component detail, not a new global radius policy.
5. Accessible interaction: visible focus, 44px slide controls, explicit pause/navigation, focus and hidden-tab autoplay suspension, reduced-motion support and image-failure feedback are implemented; these are observed homepage behaviors, not a claim of whole-site accessibility certification.

## Implementation evidence

- `frontend/src/pages/Home/HomePage.tsx`, `home.css` and `homeContent.ts` own the hero, discovery strip, story photograph, four service rows, destination gallery and closing links. Hero copy/actions sit side by side on desktop and stack on mobile; captions, source link and controls share a bottom rail.
- Existing tour, hotel, destination, restaurant, planner, account/login and attribution routes remain connected. Destination gallery links encode destination keywords; hero captions link to the selected destination detail. Editorial selections are not live inventory, prices or availability.
- `ImmersiveHeader.tsx` observes the homepage scroll container; the header becomes forest green after 40px. Obsolete homepage overrides were removed from `experience.css`, retaining shared catalog/account/header styling.
- Autoplay advances after eight seconds with a 1.4-second crossfade. Manual selection pauses it, keyboard focus suspends it, and reduced-motion preference pauses it and removes CSS transitions. The mouse hold interaction remains available. Failed hero images expose a retry action; secondary images show a meaningful fallback.

## Existing raster provenance

No new raster, catalog record or database change was introduced. `homeContent.ts` selects these existing files; their source records remain in `backend/Data/photo-sources`:

| Place | Served image | Existing source record | Credit |
| --- | --- | --- | --- |
| Hạ Long | `/media/library/ha-long-83214199.jpg` | `ha-long-83214199.jpg.source.json` | Taewangkorea, CC BY-SA 4.0 |
| Hội An | `/media/vietnam/hoi-an.jpg` | `hoi-an.jpg.source.json` | John Lian, CC BY-SA 4.0 |
| Cầu Vàng, Đà Nẵng | `/media/vietnam/cau-vang.jpg` | `cau-vang.jpg.source.json` | Supanut Arunoprayote, CC BY 4.0 |

The homepage links to `/image-credits`. `ImageCreditsPage.tsx` now resolves duplicate image paths by preferring the record with the most complete author/source/license metadata, preventing an older sparse duplicate from hiding the Hội An credit. The regression verifies that John Lian and CC BY-SA remain visible.

## Finish evidence and limits

The delegated finish review returned **ship**: persistence, fidelity and ceiling passed with no material fixes requested. The reviewer and documenter used the degraded role contracts through ordinary subagents because the harness did not expose native Impeccable role selectors. This documenter pass compared source and contracts; the visual verdict and executed verification below are the completing agent's reported evidence.

- `node tests/home-fullscreen.mjs` passed at 1440, 820, 390 and 320px widths, covering fullscreen and growing short-screen layouts, real image loading, 44px controls, links, green scrolled header, menu/Escape/focus behavior, eight-second autoplay, focus pause, reduced motion, broken-image retry and no collected browser errors.
- A subsequent `--no-capture` run passed with the image-credit regression. Homepage pixels did not change after the visual review.
- Ignored `.impeccable/review/desktop.png`, `mobile.png`, `tablet.png` and corresponding `*-hero.png` captures supplied review evidence. Full-document captures temporarily expand the nested main scroll container for capture only; hero captures use normal layout.
- Frontend production build passed. Lint reported known pre-existing warnings outside the changed files. The manual Impeccable detector ran once on the three homepage targets and returned no findings.

Verification used Chromium. This is a homepage UI refinement and attribution regression, not a complete backend audit or cross-browser certification. No git push was requested for this turn.

Not canonized or repaired: the absent global design document, stale mockup decision in `PRODUCT.md`, and incumbent small kickers/rounded catalog treatments outside the homepage remain outside this ordinary refinement; none is promoted into a new design-system rule.
