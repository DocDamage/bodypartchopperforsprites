# Implementation Plan - Doc Sprite Slicer Studio v4

## Phase 1 - Project + Library Foundation

Implemented:
- Versioned project format.
- Autosave/recovery using browser localStorage.
- Local asset library storage.
- Asset metadata schema with creator/license/source fields.
- Asset import, duplicate, delete, export, and recipe insertion.

## Phase 2 - Character Recipe Builder

Implemented:
- Recipe data model.
- Recipe layer stack.
- Recipe preview canvas.
- Recipe JSON export.
- Composed recipe PNG export.

## Phase 3 - Batch + Export Profiles

Implemented:
- Batch image import.
- Add current sheet to batch.
- Batch grid QA summaries.
- Batch package ZIP export.
- Built-in engine profiles.
- Custom profile creation/export.

## Phase 4 - QA + Rig Prep Polish

Implemented:
- QA gate settings.
- Empty-frame detection.
- Edge-clipping warnings.
- Feet/root drift warning.
- Invalid part checks.
- Missing recipe asset checks.
- License metadata checks.
- Markdown QA report export.
- Polygon masks and underlap padding.
- Duplicate mask to all frames.
- Mirror selected part.
- Save selected part as reusable asset.

## UI / UX rules enforced

- Canvas-first workspace.
- Advanced features in top menus and right-click menus.
- Inspector shows only the active workflow.
- Ctrl+K command palette for power-user actions.
- Actionable tooltips explain what changes and when to use each tool.
