# Account workflows — 30/09/2026

## Delivered

- Visible admin entry on the public header (including homepage); guest/customer do not see it. Keyboard Enter opens `/admin`. Existing server authorization remains authoritative.
- Customer cancellation request and admin approval/rejection for tour/room bookings. One request per order, Pending/Confirmed only, before service date in Vietnam. Inventory stays reserved while pending. Rejection requires a reply. Approval and capacity release commit together; successful payments block approval (refunds are not implemented). Simultaneous payment/cancellation cannot produce a successful payment on a cancelled booking.
- Account cards still open full service details and existing public feedback; separate inline cancellation controls are not nested inside the link. Display recorded successful payments and remaining amount, without claiming online payment receipts.
- Owner can edit a future/today Planning itinerary in the reused planner. Day/event replacement is transactional, validates time overlaps and active venues, preserves trip/membership/expenses, and checks optimistic Revision. Accepted members remain read-only. Venue images continue to come from the database.
- Tour duration and stops are immutable after any booking history; creation of a booking serializes with the parent-tour guard. This prevents future edits from changing eligibility evidence, but cannot reconstruct historic versions that were never stored.
- Auth 10/min/IP and feedback writes 20/min/account, with Vietnamese 429 + Retry-After. Public reads remain available. CORS allowlist replaces AllowAnyOrigin. Production defaults deny cross-origin until configured; this is not a full deployment/security audit or distributed limiter.

Impeccable harden preserved the incumbent NVT interface and informed separate link/action controls, explicit pending/error states, keyboard focus and responsive forms. Manual detector completed with exit 0 and no reported findings on the changed targets. Browser evidence is Chromium desktop 1440px/mobile 390px emulation, not physical-phone or screen-reader certification.

## Database safety

Migration: `database/migrations/20260930_account_workflows.sql`, applied through `--upgrade-account` only after backup `backend/backups/before-account-20260930-210401753.sql`. Added nullable request fields to DatTour/DatPhong and Revision to ChuyenDi. No reset/reseed; no existing user/password/booking/comment rewritten. Re-running the migration runner reported already installed with no changes. `CSDL.sql` was updated as fresh-install source, never executed.

## Verification

- Frontend production build and lint: passed. Lint retains existing warnings in older pages/shared modules.
- Backend and AdminSmoke builds: passed. Clean compilation retains existing nullable warnings. Windows initially locked the running API DLL; stopping the verified project process and rebuilding resolved this, then API was restarted.
- `node tests/account-workflows.mjs`: 10 grouped API/browser checks passed, including ownership, past-date rejection, concurrency, real admin approval UI, real customer request UI, payment/cancellation race, paid-order rejection, header role visibility, planner edit persistence/photos and CORS.
- `node tests/account-details.mjs`: 14 read-only regression checks passed, including full-card links, detail feedback, keyboard navigation and private/missing routes.
- `node tests/feedback.mjs`: 61 checks passed. Suite honors Retry-After rather than disabling the limiter. Public reads, experience-only ratings, login-only comments, moderation and ranking retained.
- `node tests/restaurant-planner.mjs`: 22 checks passed, including images, multi-event days, ordering and validation. Test now selects a tour without booking history before adding/removing its temporary activity.
- `node tests/rate-limits.mjs`: 2 checks passed; only invalid writes were sent. Rate-limited writes did not block public feedback reads. API restarted afterward to clear the test-consumed local buckets.
- Final database audit: 24 tables, 47 foreign keys checked, 0 orphan rows, 0 missing/invalid image files. All exact-tag fixtures were removed; audit-log entries remain intentionally. Existing 7 users, 3 tour orders, 3 room orders, 3 trips, 2 comments and 4 legacy reviews retained.

## Still needs verified content / production work

- Tours 45 and 46 lack daily itinerary content and remain hidden. Three tours and four destinations have fewer than two photos. These were not filled using guessed schedules or unrelated images.
- No automatic refund, online payment gateway, email notifications or new optional wishlist/coupon features were added.
- Before public deployment: configure explicit origins, HTTPS, trusted proxy handling and appropriate shared throttling/monitoring. In-process rate limits reset when the API restarts.
- Editing is limited to the owner’s Planning itinerary before/present start day; it is not a collaborative real-time editor or a historical version viewer.

Screenshots are local/ignored under `.local/admin-home-*.png`, `admin-cancel-*.png`, `customer-cancel-*.png`, `edited-plan-*.png`. No Git commit or push performed in this task.
