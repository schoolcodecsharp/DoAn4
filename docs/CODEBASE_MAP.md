# Codebase map

Verified 2026-09-23 from README, route definitions, frontend imports, API/auth code, package scripts, and source paths. This is a focused navigation index, not an audit of every module. Paths below are relative to the repository root. Confirm current code before edits; update only entries affected by completed work.

## Entry points and shared dependencies

- Stack: React 19 + TypeScript + Vite 8; ASP.NET Core .NET 9; MySQL 8.
- Bootstrap: `frontend/src/main.tsx` -> `frontend/src/App.tsx` -> route page. The app wraps routes in AuthProvider, ImmersiveHeader, and PageTransition.
- Current HTTP client, session reading, error messages, money/date formatting: `frontend/src/lib/api.ts`. Uses relative `/api`, token key `tripmate_auth`, and session-expired events on 401.
- Current auth: `frontend/src/context/AuthContext.tsx`; `RequireLogin` guards protected pages. Server-side authorization remains authoritative.
- Catalog config/types/data loading: `frontend/src/pages/User/catalog.ts` (`catalogs`, `useResource`, normalization).
- Shared visuals: `frontend/src/index.css`, `frontend/src/pages/User/user.css`, `frontend/src/experience.css`; check CSS cascade and page-specific imports before edits.
- API registration/middleware: `backend/Program.cs`. For a domain, follow `Controllers/<Domain>Controller.cs` -> relevant `Services` implementation/interface -> `Data` repository/interface -> `Models/DTOs` and database schema as needed. This is the general convention; inspect the actual calls.
- Authorization/error/audit behavior: `backend/Security/`.

## Where to start by feature

Recovery verified 2026-09-26: the identifiable UI/feature changes from the 23–24 September skill conversation were reversed using preserved pre-edit reads and patches. See `docs/RECOVERY_2026-09-26.md` for scope and limitations. `interface.css`, ArrowIcon, staged admin-image previews, the admin per-day picker, and the new account booking-detail component/API are no longer present. Original image upload, tour activities, account summaries and planner remain. No database rollback occurred. Recovery backups are local/ignored; do not treat them as live source.

| Request | Frontend source | Backend starting point / dependency |
|---|---|---|
| Home `/` | `frontend/src/pages/Home/HomePage.tsx`, `home.css`; home overrides in `src/experience.css` | `pages/User/catalog.ts`, image helpers |
| Header/navigation/transitions | `frontend/src/components/Header/ImmersiveHeader.tsx`, `components/PageTransition.tsx`, `src/experience.css` | Session context |
| Lists `/tours`, `/hotels`, `/destinations`, `/restaurants` | `frontend/src/pages/User/CatalogPage.tsx`, `catalog.ts`, `components/ProvinceSelect.tsx` | Tour, KhachSan, DiaDiem, NhaHang controllers |
| Detail `/<kind>/:id` | `frontend/src/pages/User/DetailPage.tsx`, `TourSchedule.tsx`, `Photo.tsx` | Tour, TourChiTiet, TourKhoiHanh, KhachSan, LoaiPhong, DiaDiem, HinhAnh controllers |
| Public reviews/comments on tour/hotel/destination detail | `frontend/src/pages/User/Feedback.tsx`, `feedback.css`; default rating sort in `CatalogPage.tsx` | `FeedbackController.cs`, `FeedbackRules.cs`, `CatalogImageFilter.cs`; admin `BinhLuanController.cs` / `DanhGiaController.cs` |
| Booking `/tours/:id/book`, `/hotels/:id/book` | `frontend/src/pages/User/BookingPage.tsx` | DatTour, DatPhong, MaGiamGia controllers; `backend/Services/BookingRules.cs`, `TourRules.cs` |
| Account `/account`, `/my-trips` | `frontend/src/pages/User/AccountPage.tsx` | Account controller; inspect page endpoints for the affected section |
| Trip members | `frontend/src/pages/User/TripMembers.tsx`, `trip-members.css` | ThanhVienChuyenDi controller/service/repository |
| Planner `/planner` | `frontend/src/pages/User/ItineraryPage.tsx`, `ItineraryEvents.tsx`, `itinerary.ts`, `itinerary-events.css`; location suggestions in `PlannerSuggestions.tsx` | `AccountController.cs` + partial `AccountActivities.cs`: atomic ChuyenDi/LichTrinh/LichTrinhChiTiet writes and scoped reads |
| Login/register | `frontend/src/pages/Auth/LoginPage.tsx`, `RegisterPage.tsx`, `src/context/AuthContext.tsx` | Auth controller; `src/lib/api.ts` |
| Admin `/admin/*` | `frontend/src/pages/Admin/AdminPage.tsx`, `schema.ts`, `Operations.tsx`, `ImageManager.tsx`, `admin.css` | Domain controllers, AdminReports controller, Security filters; `docs/ADMIN.md` |
| Payment recording | Admin `Operations.tsx` (confirm exact endpoint) | ThanhToan controller/service/repository; payment rules in README |
| Image credits `/image-credits` | `frontend/src/pages/User/ImageCreditsPage.tsx`, `Photo.tsx` | HinhAnh controller, `backend/Data/IMAGE-LIBRARY.md`, CatalogImageFilter |

`/saved` and `/favorites` currently redirect to `/account`. Older directories such as `pages/Tours`, `Hotels`, `Planner`, `Saved`, plus `services/api.ts` and `hooks/useAuth.ts`, are not the route/auth authority shown by App.tsx. Trace live imports before using or deleting them; do not infer all are unused solely from this index.

## Data and non-source folders

### Reviews and comments — verified 2026-09-30

- `GET /api/feedback/{kind}/{id}` is anonymous, with independent `reviewPage`/`commentPage` (10 each). Kinds: `tours`, `hotels`, `destinations`. Public entries expose author name, not account/order identifiers. `/eligibility` and POST `/reviews` / `/comments` require an active JWT account. Comment body `{content}`; review body `{stars,content}`. Author and proof are server-derived.
- `FeedbackRules.Proof` requires an owned past Completed tour or CheckedOut hotel booking. A destination requires a stop in that user's completed tour. Self-planned itineraries and invitations are not experience evidence. One verified review per user/target, including hidden reviews; author-row locks serialize duplicate submissions. Comments only require login; 2,000-character limit and one-minute identical-submit guard.
- `database/migrations/20260930_feedback.sql` adds `BinhLuan` and nullable proof-order FKs to `DanhGia`. `FeedbackUpgrade.cs` / `--upgrade-feedback` backs up before applying, resumes after completed ALTER and skips an already installed schema. Do not rerun raw ALTER or reset with CSDL.sql. Four legacy reviews remain unverified; no fabricated proofs. Catalog statistics use only visible verified reviews, overriding historical cached scores.
- Admin `/admin/comments` and `/admin/reviews` only hide/show customer content; no star/text rewriting or admin-created ratings. `dataRegistry.ts` now maps 24 tables. `BinhLuanController` uses typed camelCase DTOs with boolean status. `safeReturnTo` accepts numeric public detail routes so login returns to `#feedback`.
- `node tests/feedback.mjs` uses existing SQL accounts, isolated `FeedbackFixtures.cs` records and cleanup in finally. Tests live APIs and Chromium 1440/390 px, concurrency, moderation, catalog order and text escaping. See `docs/FEEDBACK_2026-09-30.md`; build test runner first. All test writes are tagged fixtures, not production-safe read-only checks.

### Completion review — verified 2026-09-30

- `AccountPage.tsx` derives the selected tab from `?tab=tours|hotels|trips`, including Back/Forward. `BookingPage.tsx` remounts the inner form on service/option navigation and returns successful bookings to the corresponding account tab. `lib/api.ts` distinguishes validation/conflict/rate-limit responses from connection failures.
- `backend/Services/StorageRules.cs` validates SQL date and DECIMAL(15,2) bounds. Used by room/departure writes, computed booking totals, coupon thresholds and expense dates. `LoaiPhongRepository` locks the room and prevents changing its hotel when any booking history exists, including cancelled/completed stays. Admin editor mirrors room text limits and new-departure states.
- `TourKhoiHanhRepository.Update` locks the departure before checking orders/state. Cancellation requires all bookings cancelled; completion requires the tour end and no pending/confirmed bookings; terminal departures cannot reopen. DELETE closes sales without replacing a terminal status. New departures must be today/future, OpenForBooking/FullyBooked.
- `tests/AdminSmoke/Program.cs` now resolves omitted backend path from its build directory, not the first mode switch/cwd. `--completion-checks` uses existing local SQL accounts and exact-tag fixtures, including booking/payment concurrency; it runs `ReviewRegression.cs` too. `node tests/completion-ui.mjs` verifies real booking/account navigation on desktop/mobile and one simulated validation error. Both create and clean only their fixtures; logs remain. See `docs/COMPLETION_REVIEW_2026-09-30.md`.

### Verified catalog coverage — verified 2026-09-29

- `database/verified-catalog-20260929.json` stores source URLs/date for 27 new catalog records; `tests/AdminSmoke/VerifiedCatalog.cs` handles backup, transactional idempotent import (`--verified-catalog`, writes) and province coverage (`--verified-coverage`, read-only). Existing demo records remain unverified. No fabricated inventory, photos or departures. See `docs/CATALOG_VERIFICATION_2026-09-29.md` for scope and backup.
- `CatalogPage.tsx` supplies actual catalog province groups via optional `ProvinceSelect.options`; admin's existing provider mode remains. Unknown prices sort last and are excluded from budget filters. `CatalogDescription.tsx` renders source paragraphs/links on `DetailPage.tsx`; `experience.css` handles wrapping.
- `backend/Services/TourRules.cs`: paired capacity 0/0 means unconfirmed. `TourRepository.Update` prevents clearing capacity when departures exist; `TourKhoiHanhRepository.Create` rejects unconfirmed capacity. Both lock the parent tour in a transaction. Admin `schema.ts` labels this contract and accepts min 0.
- Verify read-only public/API/UI coverage: `node tests/catalog-system-audit.mjs` (existing local credentials/services, desktop/mobile). Capacity regression: `dotnet run --project tests/AdminSmoke -- --capacity-checks` uses `CapacityChecks.cs`, writes tagged disposable tour/departure fixtures and cleans only those records. Do not confuse these with a production-safe read-only command.

### Homepage refinement — verified 2026-09-28

- `ImmersiveHeader.tsx` observes `.booking-home` scroll (not nested menu scrolling): transparent hero at top, solid forest-green `is-home-scrolled` after 40px; non-home headers unchanged.
- Homepage retains existing hero slideshow/hold controls, real library images and public links; service rows include restaurants and planner. Destination links use encoded catalog search; no database changes.
- Read-only UI regression: `node tests/home-polish.mjs` against running frontend/backend. Checks desktop/tablet/mobile, scrolling, menu keyboard focus, route return, slideshow, image loading and console errors. Captures in ignored `.local/home-after-*.png`.

### Admin database coverage — verified 2026-09-28

- `/admin/coverage` → `AdminCoverageController.cs` (admin-only live table names) + `dataRegistry.ts` / `DataExplorer.tsx`. Originally 23 tables, now 24 after the 30/09 feedback extension; unknown tables are explicitly flagged. See `docs/DATABASE_UI_COVERAGE.md` for each table's route, rights and limits.
- `schema.ts` / `AdminPage.tsx`: added rooms (hotel lookup + image owner LoaiPhong), coupons and expenses; standalone tour activities/departures select their parent tour. Filtered deep links use `id`, `hotel`, `trip`. `LoaiPhongController` create returns saved DTO/ID; coupon/expense services validate input.
- `DataExplorer.tsx`: read-only roles, trips, membership, days, events and favorites; review visibility moderation; shared image-library lookup → ImageManager. Trip → days/members/expenses and day → events links retain parent scope.
- `Payments.tsx`: manual pending transaction creation and confirm-success/failure via ThanhToan API, no editing/deleting terminal transactions or fake refunds. `Operations.tsx` supports exact order ID deep links.
- Navigation groups and mobile selector live in `AdminPage.tsx`; `coverage.css` extends incumbent admin styles with scrollable/focusable wide tables and legible forms. Public home/design comp remains unchanged.
- Verify: `dotnet build tests/AdminSmoke`, then `node tests/admin-coverage.mjs` with local services and existing ignored SQL credentials. Uses exact-tag disposable fixtures, no new users; finally cleans its own records. Existing restaurant-planner regression remains applicable.

### Restaurant and itinerary extension — verified 2026-09-26

- Public `/restaurants` and `/restaurants/:id` use the existing NhaHang API and catalog image library. The detail page links to `/planner?destination=...&restaurant=<id>` to preselect a restaurant; adding it does not reserve a table.
- Admin `/admin/restaurants`: schema-driven CRUD, soft hide, existing ImageManager with owner `NhaHang`. NhaHang create now returns the saved DTO including its ID. Tour activities already support all three place types; the admin selector now previews the selected place's images and `TourSchedule.tsx` links restaurants to their public detail page.
- `POST /api/account/itineraries`: each day optionally accepts `activities[]` with `loaiDiaDiem` (`DiaDiem`/`NhaHang`/`KhachSan`), `maDoiTuong`, `thoiGianBatDau`, `thoiGianKetThuc` (`HH:mm:ss`), and optional `ghiChu` (500 chars). Max 20/day, 30 days; active targets only, same-day increasing times, no overlaps. Sorted by start time on save. Legacy notes-only days remain valid. No schema migration required.
- `GET /api/account` nests saved activities and image metadata under each trip's days. Read access remains scoped to the owner or accepted members; image hydration is batched per place type. Account `?tab=trips&trip=<id>` opens the saved itinerary with dates, times, place links, notes and photos.
- Images reflect database records, not generated identities. Current restaurant seed images are explicitly captioned regional illustrations, not actual restaurant photos. Admin can upload actual venue photos.
- Targeted regression: `node tests/restaurant-planner.mjs` from root, requires running services and existing credentials in ignored `.local/test-accounts.json`. Creates and deletes only its own temporary trips/tour activity; does not create accounts. Uses live APIs and Chromium desktop/mobile (1440/390 px); province provider alone is stubbed. See `docs/RESTAURANT_PLANNER_2026-09-26.md`.

- `database/`: schema, seeds, migrations. `CSDL.sql` drops the database: use migrations for existing data.
- `backend/wwwroot/media/`: served images. `backend/Data/photo-sources/`: source/license/hash metadata; preserve it. `AnhDuLich/`: browsable originals.
- `docs/ADMIN.md`, `docs/WORKFLOW_UPGRADE.md`: detailed domain guidance when relevant. `docs/AUDIT_2026-09-16.md`: historical findings, not proof of current behavior.
- `docs/reports/`, `docs/diagrams/`, `archive/`, backups, `node_modules`, `bin`, `obj`, `dist`, `test-results`: exclude from routine code discovery.
- Membership is for self-planned trips, not tour passengers/room inventory. Payments are manually recorded by admin; do not imply a real payment gateway or implemented refunds. Confirm full business rules in README and affected services.

## Run and verify

- Frontend: in `frontend`, `npm run dev -- --host 127.0.0.1 --port 5173`. Backend: from root, `dotnet run --project backend`. Vite proxies `/api` and `/media` to backend; see `frontend/vite.config.ts`.
- Frontend code changes: in `frontend`, `npm run build` and `npm run lint`.
- Backend changes: `dotnet build backend`; use affected checks in `tests/AdminSmoke` after inspecting prerequisites.
- Browser specs: `frontend/e2e/workflows.spec.ts`, configuration `frontend/playwright.config.ts`; `npx playwright test` from frontend. Requires running services and Chromium. Inspect tests for fixture/data writes before running.
- README documents AdminSmoke `--audit`, `--check-sample-data`, `--functional`, and `--browser`. Functional/catalog expansion modes can write to the database; choose checks appropriate to the task.
- Documentation/skill-only changes: validate skills, links, and map paths; application rebuild is not needed.

## Targeted reading procedure

Read the relevant row, then check working-tree changes for those paths. Open the live page/component and follow only necessary helpers, endpoints, service rules, data contracts, and tests. Use `rg` in the relevant directories if a symbol or feature is absent here. Broaden the search only when dependencies or uncertainty require it. Never store credentials, tokens, user records, or raw runtime logs in this map.
