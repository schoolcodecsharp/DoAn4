# Admin detail dialogs — 2026-10-04

## Scope

The user requested that admin “Xem chi tiết” open a popup instead of expanding below the list. `DataExplorer.tsx` is the shared owner for all ten data-registry detail views: provinces (direct route), comments, roles, trips, members, days, events, reviews, favorites and images.

- Reuses the portaled native `FormDialog` with the existing NVT green/cream design, matching add/edit dialogs. Details remain read-only; no customer data becomes editable.
- Keeps every previously displayed field, related-record link, activity photo, image preview and moderation action.
- Service albums opened from image details use a dialog too. Upload/edit dialogs remain nested; Escape closes only the active layer.
- Closing returns keyboard focus to the opener and preserves the list/search. Narrow screens use one detail column with wrapped text.
- Failed moderation retains the detail and displays its error inside the popup. Closing is disabled while submitting. Success closes and displays the existing list notice.
- No backend, API, schema, authorization or database changes. Previously requested sidebar simplification is preserved.

## Verification

`node tests/admin-detail-dialogs.mjs` passed 35 grouped checks:

- All ten registry routes with real existing SQL records at 1440, 390 and 320 px; no empty-section fixture was needed.
- Fields retained, no inline details, viewport fit, trapped keyboard focus, Escape/footer close, focus restoration, retained search and trip/day navigation.
- Nested image-detail / service-album / upload dialogs at all three widths.
- Comment/review busy-close protection, visible failures, unchanged text and success-close notices. These four write responses were intercepted and mocked in Chromium, never sent to SQL; live server moderation was not retested.
- No browser JavaScript errors. Screenshots under ignored `.impeccable/review/admin-details/` inspected together on desktop/mobile.

Frontend build passed (existing >500 kB bundle warning); lint passed with warnings in existing unrelated files. Impeccable detector reported no findings for the changed UI targets. `git diff --check` passed. Existing local services and an ignored local account file are required to rerun the test; credentials are not stored here.
