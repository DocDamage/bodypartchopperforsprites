# Roadmap

This roadmap keeps future work focused and prevents the UI from becoming cluttered.

## Now: v6 repo hardening

- Add README and docs.
- Add static server script.
- Add smoke tests.
- Add sample project data.
- Keep the app runnable as a static page.
- Do not add more permanent panels.

## Next: module split

Refactor `app.js` into modules without changing behavior.

Suggested target structure:

```text
src/
  app.js
  state/
    defaults.js
    project-format.js
    migrations.js
  canvas/
    draw.js
    hit-testing.js
    frame-utils.js
  ui/
    actions.js
    inspector.js
    command-palette.js
    context-menu.js
    tooltips.js
  plugins/
    registry.js
    plugin-settings.js
  importers/
    generic-spritesheet.js
    asset-pack.js
  exporters/
    frames-zip.js
    workspace-zip.js
    runtime-bundle.js
    profiles.js
  validators/
    diagnostics.js
    visual-diff.js
    project-integrity.js
  labs/
    timeline.js
    pose.js
    remap.js
    atlas.js
```

## V7 candidate

V7 should be the first architecture release, not a feature dump.

Goals:

1. Move constants and defaults out of `app.js`.
2. Move project save/load/migration into `src/state/`.
3. Move drawing and hit testing into `src/canvas/`.
4. Move validators into `src/validators/`.
5. Move exporters into `src/exporters/`.
6. Keep UI behavior identical.
7. Expand smoke tests to cover migrated modules.

## Later

- Optional Vite build.
- Better automated tests.
- Example sheets for visual regression.
- True plugin module loading.
- Optional desktop wrapper.
- Optional Godot/KeterEngine direct importer scripts.

## Avoid for now

- Cloud sync.
- Collaboration.
- Full drawing/painting suite.
- Full Spine clone.
- AI-based body-part extraction.
- 3D model import.
