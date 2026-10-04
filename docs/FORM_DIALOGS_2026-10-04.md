# Add/edit forms — 2026-10-04

Requested behavior: adding/editing opens a popup, editing starts with existing data, successful saves close and announce success, and failures preserve values with errors near affected inputs. NVT green–cream styling is retained; Impeccable Operate/Harden guided consistent controls, accessible error descriptions, focus, small-screen layouts and recovery states.

## Scope

- All 11 admin schema editors: destinations, tours, hotels, rooms, restaurants, categories, accounts, coupons, expenses, tour activities and departures.
- Image upload and caption/order editing; payment recording; cancellation decisions.
- Tour/hotel booking, personal itinerary editing, individual day/activity editing, member invitations, comments, eligible star reviews and cancellation requests.
- Read-only expandable information remains expandable. Authentication pages are unchanged. No backend permissions, rating eligibility, cancellation policy or database schema was weakened or changed.

Native dialogs are portaled outside scroll containers. They support keyboard trapping, focus restoration, Escape/close/backdrop, confirmation before discarding modified fields and protection while saving. Child submit/Escape events do not propagate to the trip or management dialog. ModelState errors map to field names; recognizable business validation can also mark fields. A server/network error that does not identify an input stays a clear form-level error.

Day/activity edits update a local itinerary draft; their success text explicitly says draft. Only the final successful itinerary save clears that draft and announces a saved itinerary in the account. Booking success still means a pending request, not a charge or confirmed payment. Failed multi-file uploads retry only the remaining files.

## Verification

- `npm run build` and `npm run lint` from `frontend`: successful. Lint has pre-existing legacy-page/catalog/auth warnings; no new form warnings. Vite reports the main bundle around 500 kB, a non-blocking chunk-size warning; code splitting is not part of this form change.
- `node tests/form-dialogs.mjs`: 41 grouped checks for admin desktop/mobile and user 1440/390/320, required fields, API errors, prefilled editing/saving where an existing row is available, success closure/notices, nested dialogs, images including partial retry, payments, admin/customer cancellation, membership, stars, booking dates, planner times and overlaps. Also verifies 503/429 recovery and duplicate-submit/busy-close protection. Existing SQL accounts and read-only data/estimates; all mutations are browser-intercepted. Screenshots under ignored `.impeccable/review/form-dialogs/`.
- `node tests/account-details.mjs`: 14 grouped read-only checks including service-card routes, reload/Back, public feedback, actual rating eligibility, membership, unknown/private details. No JavaScript page errors.
- `node tests/journey-refinements.mjs`: 6 grouped read-only checks at 1440/390/320 including price/availability, draft restore/discard/account isolation, simulated save conflict/success and missing-stock/quote failures. No JavaScript page errors; no SQL writes.
- Impeccable detector ran once on shared dialogs and affected admin/user form targets and returned exit 0.
- Writable fixture suites `feedback.mjs`, `planner-costs.mjs`, `restaurant-planner.mjs` were updated for popup selectors but not executed. The older `frontend/e2e/workflows.spec.ts` includes pre-existing legacy planner selectors and was not run or represented as passing. A real persisted add/edit of every entity, real image uploads, physical touch devices and a physical screen reader are not claimed as verified.

Unrelated existing header changes and uploaded media were preserved. No Git commit/push was requested in this turn.
