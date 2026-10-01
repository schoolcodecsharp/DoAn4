# Planner costs and booking information

Date: 2026-10-01. Scoped implementation in the existing NVT interface, not a whole-site redesign.

## Delivered

- A cost ledger by activity, day, trip and person, with the user's budget kept separate. Missing rates do not become zero; known subtotal excludes them explicitly. Room cost is charged once to the check-in activity, including all nights; stays past the trip end are flagged.
- Destination tickets multiply the stored rate by ticket count. Confirmed free admission requires `MienPhi=true`; existing zero-price records are unconfirmed by default. Admin can set this after verifying the venue. Restaurant prices use stored min/max ranges per planned diner, labelled reference estimates.
- Hotel stop: choose room type, guest/room count and checkout date (1–30 nights). Check-in follows the activity date. Availability uses the least available inventory across all nights, excluding checkout day; Pending, Confirmed and CheckedIn bookings hold rooms. Capacity is checked separately. Quote includes the time checked. No external hotel/channel-manager inventory is consulted.
- Save/reopen/edit retains a server-calculated cost snapshot per event. Refresh/save recalculates from current prices. A stored quote is not a payment, booking or availability guarantee. A hotel booking link opens a new tab, leaving the planner draft in place, and prefills the requested stay.
- Booked tour/room cards retain public detail links. A separate disclosure shows dates, historical unit price, quantities, payment ledger amount and booking note, with current room description or day-by-day tour schedule below.

## Storage and migration

`DiaDiem.MienPhi` (boolean, default false) and nullable `LichTrinhChiTiet.DuToan` (JSON) are additive. Existing `ChiPhi` stores the known estimated minimum (null for unpriced activities); JSON preserves the range and selected room. Old activities without JSON show no estimate. No fictitious prices, stock, departures, free flags or images were added to real catalog records.

Applied via `--upgrade-planner`, with backup `backend/backups/before-planner-20261001-162739774.sql` before ALTER. The runner checks each column for resumability/idempotence. `database/CSDL.sql` was edited as fresh-schema source only, never executed.

## Verification

- Backend and frontend builds passed; repository legacy nullable/lint warnings remain. New frontend helpers were split out of component files to avoid new fast-refresh warnings.
- `--planner-checks`: 20 assertions passed, including paid/free/unknown tickets, restaurant ranges, room multiplication, per-night occupancy and checkout boundary, cancelled/checked-out exclusion, insufficient inventory/capacity, wrong room, negative quantities, anonymous rejection, persisted snapshots after catalog price changes, cross-account edit rejection, stale revisions, money overflow, historical order prices and no reservation side effect.
- `tests/planner-costs.mjs`: 1440px and 390px Chromium checks passed for estimate updates, room shortages, retry/no stale totals, booking prefill/new tab, keyboard navigation, save/edit/reload, historical order details, no JavaScript errors and no horizontal overflow.
- `tests/account-details.mjs`: 14 existing service-card, feedback, private-route and missing-record checks passed, read-only.
- `tests/account-workflows.mjs`: 10 grouped cancellation, payment-race, owner/revision, admin navigation, CORS and runtime checks passed. The first run's CORS check failed because the manually launched backend used Production settings; rerunning under the documented Development environment passed without loosening the CORS policy.
- Independent finish review requested one material correction: warning-rich/long sticky ledgers could hide Save below the viewport. The breakdown is now height-constrained and keyboard-scrollable with a separate always-visible action area on desktop; mobile remains normal document flow. The test confirms Save stays in view with warnings and with 30 daily rows at 1440×1000.
- Temporary integration fixtures and UI trips were removed in finally; existing SQL users, bookings and real catalog rows were preserved.
- Impeccable detector ran once over finished targets and returned `[]`. Existing NVT layout, typography and imagery were retained. Screenshots: `.impeccable/review/planner/`; expanded full-page captures are supplemented by actual viewport captures because the app scrolls inside main.

## Boundaries

Room availability reflects this project's database only and can change after checking. Saving a plan does not reserve any service. Estimates omit transport/shopping/other costs not entered as service activities. Unknown catalog prices still need verified data from the supplier. Enter a stay once, not as another hotel charge on each day. Public discussion/rating eligibility and existing cancellation/payment flows are unchanged.

## Design-system comparison and finish verdict

The Impeccable documenter compared the incumbent `.local/planner-before.png` with the supplied 1440px planner and 390px room/booking viewport captures, including `planner-long-1440.png`, and checked `experience.css`, `user.css`, `planner-costs.css`, `ItineraryPage.tsx`, `ItineraryEvents.tsx`, `PlannerCosts.tsx`, `planner-pricing.ts`, `BookingInformation.tsx`, `AccountPage.tsx` and `BookingPage.tsx`. Product and surface authority came from `PRODUCT.md`, `docs/PLANNER_SURFACE.md` and its matching `.impeccable/surfaces/` brief. Expanded full-page captures in `.impeccable/review/planner/` supplement the actual main-scroll viewport evidence.

- Palette: retained forest ink (`#284b41`), paper (`#f1efdf`), cream surfaces (`#fffef8`) and pale rules (`#d8dbcb`). Muted copy and rust warnings are local functional roles, not a new global palette.
- Type: retained EuclidSquare and the light heading character; the planner uses a compact responsive heading, readable form labels and tabular money. No new font or global type scale was introduced.
- Form: retained the trip form/summary relationship, existing controls and service links. Role-specific planner CSS adds ruled days, adjacent cost information, visible focus and a stacked mobile ledger; separate native booking disclosures preserve public service navigation.
- Imagery: existing real catalog photographs continue through `Photo`/`LibraryPhoto` with their existing provenance and honest missing-image states. No image comp was approved and no new raster asset was generated or shipped.
- Scope rule: estimates remain distinct from budget, confirmed free admission from unknown price, and current availability from a reservation. These are this surface's functional contracts; its composition and one-off measurements are not promoted into global design-system rules.

Finish verdict: **ship at the reviewed single-fix scope**. The initial review requested a correction for an oversized sticky ledger hiding Save. The final source and long-ledger capture show bounded, keyboard-focusable scrolling content with a separate Save footer; mobile stays in normal flow. The reviewer accepted that correction. This records that bounded acceptance, not a new whole-surface review claim. Detector and functional verification results are recorded above.

Pre-existing drift was reported without repair: root `DESIGN.md` is absent, and `PRODUCT.md` still carries an older homepage mockup approval decision. The incumbent account kicker is not canonized as a reusable design rule. This ordinary extension did not authorize a replacement visual world or global system update; no `DESIGN.md` or design sidecar was created.
