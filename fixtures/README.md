# Test Fixtures

This folder is for local sprite sheet samples used during development and testing.

## Folder Structure

```
fixtures/
  freeform_fighting/   # Green/mint chroma fighting-game atlases
  panel_fighting/      # Dark panel-based fighting sheets with dividers
  jrpg_tiny/           # Small SNES-style JRPG character sheets
  compilation_reference/ # Large multi-entity monster/NPC catalogs
  fx_projectiles/      # Effects and projectile sheets
  transparent_atlas/   # Alpha-transparent non-grid atlases
  grid/                # Uniform grid sheets
```

## Usage

Drop your own sprite sheets into the appropriate folder. The atlas importer tests can reference them, but **do not commit copyrighted assets** to the repo.

## Supported Formats

- PNG (RGBA, RGB, indexed)
- GIF (static sprite sheets; first frame is used)

## Running Tests

```bash
npm test
node tests/atlas-importer-test.mjs
```
