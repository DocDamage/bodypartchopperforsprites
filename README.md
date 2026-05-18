# Body Part Chopper for Sprites

Doc Sprite Slicer Studio v6 is a local, browser-based spritesheet workstation for slicing sprites, chopping visible body parts into rig-prep layers, managing reusable sprite assets, building character recipes, validating alignment, previewing animation clips, and exporting engine-ready metadata.

The app is intentionally offline-first. It is a static HTML/CSS/JavaScript tool and can run from a local static server without accounts or cloud services.

## Current version

`6.0.0`

V6 is cumulative. It includes the earlier slicer, rig-prep, asset-library, recipe-builder, batch, plugin, recovery, QA, and export-profile work, plus:

- Animation Lab / timeline clips
- Onion-skin review
- Pose Lab for deterministic rig-part transform tests
- Sheet Remapper plans
- Atlas Lab
- Runtime bundle export
- Plugin registry foundation
- Static smoke tests

## Quick start

```bash
npm install
npm run serve
```

Then open:

```text
http://localhost:5173
```

Run smoke tests:

```bash
npm test
```

The app can also be opened directly as `index.html`, but using the local server is safer for browser file and module behavior.

## Core workflow

1. Import a spritesheet.
2. Detect or configure the grid.
3. Label rows and directions.
4. Slice frames and preview animation rows.
5. Draw rig parts and pivots.
6. Save reusable parts into the asset library.
7. Build a character recipe from library assets.
8. Run QA diagnostics.
9. Export frames, manifests, runtime bundles, reports, and workspace ZIPs.

## Main files

```text
index.html                 App shell and UI structure
styles.css                 Canvas-first dark UI
app.js                     Current monolithic app implementation
package.json               Local scripts
scripts/static-server.mjs  Local static server
tests/static-smoke-test.mjs Static regression smoke test
docs/                      Project docs
samples/                   Sample project data
```

## Repo hardening status

The app currently works as a static single-page tool. The next architectural goal is to split `app.js` into modules without breaking behavior:

```text
src/state/
src/canvas/
src/importers/
src/exporters/
src/validators/
src/plugins/
src/ui/
```

Until then, tests should guard the current single-file implementation from regressions.

## Browser storage

The app uses `localStorage` for autosave, recovery, plugin settings, recent projects, and the local asset library. Save project files and workspace ZIPs regularly; browser storage is not a substitute for source control or backups.

## License note

The code in this repository is project-private unless a license is added. Imported third-party sprite assets may have separate licenses. For LPC-style assets, keep credits and source metadata attached to library assets and exported packages.
