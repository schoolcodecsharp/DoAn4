# Restaurants and timed itinerary events

Implemented 2026-09-26 without resetting the database or changing the pending homepage design concept.

## Usage

- Customer: menu → Nhà hàng → detail → Thêm vào lịch trình; or open `/planner` and choose a stop from Điểm tham quan / Khách sạn / Nhà hàng. Each stop has its database image, start/end time and activity note.
- A day supports 20 activities; a trip supports 30 days. Activities are sorted by time when saved. Overlapping or reversed time ranges are rejected. Overnight activities should be split across days.
- Save opens the matching itinerary under account → Lịch trình của tôi. Its expanded day sections show actual dates, times, notes, images and links to place details.
- Admin: `/admin/restaurants` → create/edit → save → upload photos. For tours: `/admin/tours` → edit tour → Lịch trình từng ngày → add activity → Ăn uống → choose restaurant. The selected place's photo is shown before saving.
- Scheduling is planning only, not a tour/room/table reservation. Actual venue availability, check-in times, opening hours and costs must be confirmed separately.

## Verification

- Frontend TypeScript + production build: pass.
- Backend build: pass. Initial full compile retains existing nullable warnings; incremental build reports zero errors.
- `npm run lint` (oxlint): pass with existing warnings in legacy pages and shared hooks; no warnings in the new itinerary editor/helper.
- `node tests/restaurant-planner.mjs`: 22 checks passed using existing SQL user/admin accounts. Includes public photos, login requirement, private-trip scoping, three event types persisted in chronological order, notes-only compatibility, six invalid-request cases, atomic rejection, customer/admin permissions, UI save/reload, admin restaurant photos and adding a restaurant to a tour with image preview, tour photo/detail links.
- Chromium desktop 1440px and mobile viewport 390px: no horizontal overflow in planner, restaurant catalog or restaurant detail. No page errors in exercised routes. Planner screenshots inspected in one initial and one confirmation round. No physical-device/Safari/Firefox validation performed.
- Impeccable hardening applied to timed forms, labels, responsive layout, focus and missing/error states. Detector command on finished planner/editor/admin targets exited 0 with no output. Existing site styling preserved.
- Test-created trips and the test-created tour activity were deleted after each run; existing accounts, bookings and catalog entries retained. Administration audit entries from test actions may remain.

## Data limitation

All five current restaurant records have image links, but the existing captions identify them as regional illustrations, not restaurant photographs. Captions remain visible. No invented venue photos were introduced; actual photos can be uploaded in admin. Missing images show an explicit update placeholder.

The homepage Perusi-inspired mockup remains separate and unapproved; this feature does not implement that redesign.
