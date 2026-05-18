# Release Checklist

Use this before tagging a release or merging large changes.

## Basic verification

- [ ] `npm test` passes.
- [ ] `npm run serve` starts the app locally.
- [ ] App opens at `http://localhost:5173`.
- [ ] Browser console has no startup errors.
- [ ] Main canvas renders.
- [ ] Command palette opens with `Ctrl+K`.

## Core workflows

- [ ] Import spritesheet.
- [ ] Detect grid.
- [ ] Toggle grid/frame numbers/bounding boxes/pivots.
- [ ] Preview animation row.
- [ ] Add rectangle part.
- [ ] Add polygon part.
- [ ] Add pivot.
- [ ] Save selected part as asset.
- [ ] Add asset to recipe.
- [ ] Compose recipe preview.
- [ ] Run diagnostics.
- [ ] Export QA report.
- [ ] Export frames ZIP.
- [ ] Export workspace ZIP.
- [ ] Save project.
- [ ] Reopen project.

## V6 labs

- [ ] Timeline Lab creates row clip.
- [ ] Onion skin toggles without canvas errors.
- [ ] Pose Lab saves pose snapshot.
- [ ] Sheet Remapper generates plan.
- [ ] Atlas Lab generates atlas manifest.
- [ ] Runtime bundle JSON exports.

## Data safety

- [ ] Autosave writes without error.
- [ ] Recovery package exports.
- [ ] Backup project exports.
- [ ] Older project files migrate without losing known fields.

## Documentation

- [ ] README reflects current version.
- [ ] Project format docs are current.
- [ ] Plugin docs are current.
- [ ] QA rules are current.
- [ ] Export profile docs are current.
- [ ] Changelog entry added.
