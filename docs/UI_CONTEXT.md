# UI context for NVT Du lich

Recorded 2026-09-23. This records user preferences and source evidence for future UI work; no screenshot-based visual audit has been performed as part of this setup.

## User preferences

Use Impeccable by default for interface work. The user wants a more beautiful, less generic AI-looking interface. No specific replacement palette, typeface, layout, or reference site has been requested. Decide refinements in the context of the requested surface; a wholesale redesign needs its own scope.

## Existing implementation evidence

- README identifies a Vietnamese tourism project with destination/tour/hotel discovery, booking, personal itineraries, and administration.
- Current routes and owners are recorded in `docs/CODEBASE_MAP.md` (repository-relative).
- `frontend/src/experience.css` declares warm paper `#f1efdf`, forest ink `#284b41`, surface `#fffef8`, muted `#7d887b`, and line `#d8dbcb`. These are existing values, not accessibility-approved combinations or immutable user choices.
- `frontend/src/index.css` loads local EuclidSquare font files. Check Vietnamese glyph rendering and fallback before adding fonts.
- The existing frontend has destination photography, an immersive header/menu, a home hero, and route transitions. Inspect the actual page and styles before preserving or modifying them.
- Image helpers and source attribution exist; use real media appropriate to the destination. Do not invent bookings, reviews, partners, prices, or availability to make a mockup look fuller.

## Working expectations

Make hierarchy, legibility, and the user's next action clear. Brand expression suits discovery/home pages; booking, planner, and admin need especially clear forms, feedback, and information density. Use focused styling changes and shared tokens where practical; check the CSS cascade across pages. Keep Vietnamese labels, visible keyboard focus, useful validation and loading/empty/error states, mobile usability, and reduced-motion support in view.

Impeccable is installed in `C:/Users/truon/.codex/skills/impeccable`. The installer copied the official `pbakaus/impeccable` skill, version 4.3.1. Its context launcher was successfully run during setup. No automatic detector hook was installed: follow its manual detector instruction after UI edits. Its full product interview (`init`) and live-browser integration have not been performed by this setup; this file does not claim otherwise.
