# Homepage amplification — 2026-10-02

## Subsequent user refinement: numbered controls and footer

After viewing the thumbnail version below, the user explicitly preferred 1–2–3 controls and requested a stronger footer. The current implementation follows that preference: no thumbnail images in the hero controls, unchanged destination-aware accessible names and 44px targets. The footer is now forest green with a large NVT identity, two navigation groups and an attribution/back-to-top bottom rail. Existing truthful brand copy is reused; no invented contact or social information.

The back-to-top button scrolls the homepage's nested container, focuses its heading and honors reduced motion. Verification: frontend build passed, expanded homepage test passed at 1440/820/390/320 with zero collected browser errors, manual detector returned `[]`. Desktop/mobile footer images were visually inspected in the same batched pass; no correction round was needed. New coverage includes exact numeric text, no selector images, seven footer routes and keyboard back-to-top/focus. The following amplification record remains historical where it discusses thumbnails or the light footer. No new media, backend or database changes.

## Scope

The user requested a more beautiful, modern and more striking homepage. This is an Impeccable **bolder** pass within the existing NVT visual world, not a new identity or a redesign of booking, account, catalog or admin pages. The current surface contract is `.impeccable/surfaces/frontend-src-pages-home-homepage-tsx.md`; `docs/HOME_REFINEMENT_2026-10-02.md` records the earlier fullscreen refinement.

Only `frontend/src/pages/Home/HomePage.tsx`, `home.css`, `homeContent.ts` and the homepage regression are implementation targets. Existing service routes, Vietnamese copy, session-aware account link, public image credits and the header's admin entry remain. No API, schema, catalog record, raster file or attribution metadata changes are part of this pass. The existing homepage is the visual authority; `PRODUCT.md`, the absent global `DESIGN.md` and the stored comp-led setting are not repaired or replaced as a side effect.

## Five-line system comparison

1. **Palette:** NVT forest ink (`#284b41`), warm paper (`#f1efdf`) and pale surface (`#fffef8`) remain. The service section now carries the forest background; destination photography sits on paper. This is a change of emphasis, not a new palette.
2. **Typography:** EuclidSquare with Arial/sans-serif fallbacks remains. The story heading now reaches 88px on large screens, with the footer identity at 96px; responsive sizes and the existing readable body text remain.
3. **Opening:** the three-slide photographic hero remains fullscreen, with the same headline/actions and a bottom rail. Named image thumbnails make the available scenes visible; the existing slow crossfade remains without added image zoom.
4. **Page rhythm:** a wide story heading leads into copy and the Hội An photograph, followed by a dark service interlude. The five-place spread alternates image proportions and vertical offsets instead of repeating equal-sized cards. Mobile returns to one column.
5. **Interaction:** native service links, keyboard focus, slide controls, pause behavior, reduced motion and image failure/retry remain. Service hover treatment uses color rather than animating layout-affecting padding; the initial detector finding and correction are recorded below.

## Implementation and boundaries

- `HomePage.tsx` preserves all four service routes: tours, hotels, restaurants and planner. The story heading is now independent of its copy/photo columns; the service heading and planner action form one readable introduction; the footer pairs a larger NVT mark with existing links.
- `homeContent.ts` still pins the three hero photographs and now exports `homeDiscoveries` for the five-place editorial spread. Hang Múa and the Chế Cu Nha terraces reuse already licensed local assets. These are discovery selections, not current availability, ticket prices or stock.
- Hero autoplay remains eight seconds with a 1.4-second exponential-eased crossfade and no image zoom. Explicit pause, manual selection, keyboard-focus suspension, hidden-tab suspension and the existing mouse-hold interaction remain. Reduced-motion preference disables transitions and starts autoplay paused. Thumbnail accessible names include both slide number and place, for example `Xem ảnh 1: Hạ Long`.
- The fullscreen layout can grow on short or zoomed screens so controls remain reachable. Hero thumbnails and service rows retain native button/link semantics. The unchanged shared header still becomes green after scrolling the homepage container.
- `tests/home-fullscreen.mjs` remains read-only and now covers the expanded photographic content alongside existing navigation, image-credit and interaction checks. No database writes are involved.

## Existing raster provenance

All five photographs already existed in the repository before this pass. The following links point to their source metadata; the metadata, local files and public `/image-credits` route remain authoritative. Repeated uses in thumbnails or the story are the same rasters, not new media.

| Place and served path | Existing metadata | Author / license |
| --- | --- | --- |
| Hạ Long — `/media/library/ha-long-83214199.jpg` | [Source record](../backend/Data/photo-sources/ha-long-83214199.jpg.source.json) | Taewangkorea / CC BY-SA 4.0 |
| Hội An — `/media/vietnam/hoi-an.jpg` | [Source record](../backend/Data/photo-sources/hoi-an.jpg.source.json) | John Lian / CC BY-SA 4.0 |
| Cầu Vàng, Đà Nẵng — `/media/vietnam/cau-vang.jpg` | [Source record](../backend/Data/photo-sources/cau-vang.jpg.source.json) | Supanut Arunoprayote / CC BY 4.0 |
| Hang Múa, Ninh Bình — `/media/coverage-20261002/destination-112-121361148.jpg` | [Source record](../backend/Data/photo-sources/destination-112-121361148.jpg.source.json) | Shyamal / CC BY-SA 4.0 |
| Chế Cu Nha terraces, Mù Cang Chải — `/media/coverage-20261002/destination-127-61895716.jpg` | [Source record](../backend/Data/photo-sources/destination-127-61895716.jpg.source.json) | Doan Tuan danny_pham93 / CC0 |

## Verification status

The completing agent reported the following evidence across two bounded batched rounds: initial inspection and final confirmation after one correction batch. This documenter checked the current source, surface contract and the five metadata files; it did not independently execute the UI suite or issue a visual verdict.

- `node tests/home-fullscreen.mjs`: first batched round passed at 1440, 820, 390 and 320px widths, including image loading, routes, keyboard/menu behavior, hero controls, focus/autoplay/pause, reduced motion, image-error retry and source attribution.
- Fresh viewport and full-page captures are in ignored `.impeccable/review/`. Full-page captures expand the nested scroll container for capture only; hero captures use normal layout.
- `npm run build` in `frontend`: passed before and after the correction batch. `npm run lint`: no errors, 27 pre-existing warnings reported.
- The manual Impeccable detector ran once on the homepage targets. It identified a layout-affecting padding transition on service rows. The single correction batch replaced this with color-only hover, removed the unnecessary hero zoom and clarified thumbnail accessible names. The independent review passed attribution and layout and approved after checking the corrections in source.
- Final confirmation after that batch: **PASS**. The homepage browser suite passed again at 1440, 820, 390 and 320px with zero collected browser errors. No further polishing loop was performed.
- Delegated finish reviewer verdict: **APPROVED** after source closure of the reported findings.

Verification is scoped to the homepage in Chromium; it is not a whole-site accessibility certificate, a cross-browser audit or a backend test. No commit or push is authorized by this homepage request.
