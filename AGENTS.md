# Project instructions

## Context for feature work

Read `docs/CODEBASE_MAP.md` first for implementation, diagnosis, or review tasks. Use the `project-context` skill at `C:/Users/truon/.codex/skills/project-context/SKILL.md` when available. Start from the mapped feature and expand through its actual imports and API dependencies; do not reread the whole repository routinely. The map is a navigation aid, not a substitute for inspecting current code. Update affected map entries when routes, ownership, contracts, or verification commands change.

## UI work: Impeccable by default

The user explicitly wants Impeccable applied when building or changing this project's interface. Read and use `C:/Users/truon/.codex/skills/impeccable/SKILL.md` for frontend/UI requests, even when the user does not repeat the skill name. On another machine, resolve the installed `impeccable` skill by name; report if missing rather than claiming to have used it.

Use the matching Impeccable playbook and read its craft floor before UI edits. Run its context launcher once per session from this project root. Use `docs/UI_CONTEXT.md` for repository evidence and the user's preferences; it is not a confirmed Impeccable product interview or replacement for PRODUCT.md/DESIGN.md. Do not rerun product discovery for every small refinement.

Aim for an intentional, distinctive travel interface with clear typography, spacing, hierarchy, and real destination imagery. Avoid mechanically repeated card grids, decorative gradients, excessive rounded containers, and unnecessary motion. Preserve product facts and working flows; distinguish polish from a requested redesign. Support Vietnamese copy, keyboard focus, mobile layouts, reduced motion, and loading/empty/error states. Verify UI changes in desktop/mobile views when browser access is available; state any verification limitation. Run the Impeccable detector once on finished UI targets when no hook is active, and interpret findings against the brief.

## Repository care

`frontend/src/App.tsx` is the current route authority. Current pages use `frontend/src/lib/api.ts` and `frontend/src/context/AuthContext.tsx`; do not switch them to the older auth/API layer accidentally. There are pre-existing uncommitted changes: preserve unrelated work. Exclude generated files, media libraries, backups, reports, and archive content from routine source scans. Never initialize an existing database with `database/CSDL.sql` (it drops the database). See README.md for setup and data-changing test commands.
