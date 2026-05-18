# V7 Importer Core

This pass adds pure importer helpers for spritesheets and asset packs while keeping the browser UI on the legacy `app.js` runtime.

## Added

```text
src/importers/asset-pack.js
src/importers/spritesheet.js
tests/importer-module-test.mjs
```

`src/index.js` exports both importer modules, and `tests/all-tests.mjs` includes the importer module test.

## Asset pack helpers

- parse simple CSV credits with quoted comma support
- normalize CSV headers into safe keys
- infer asset category from filenames
- match metadata records by file or stem
- match credit records by file, filename, or name
- build normalized asset records with creator, license, tags, source URL, notes, and frame size

## Spritesheet helpers

- build source image records
- detect grid settings from source dimensions using the canvas grid detector
- keep compatible row labels or generate defaults
- normalize source basenames for export
- identify supported image and metadata filenames

## Test coverage

The importer module test covers:

- quoted CSV field parsing
- credit row parsing
- category inference
- metadata and credit matching
- normalized asset record creation
- source record creation
- LPC-style grid detection
- basename normalization
- image and metadata file extension detection

## Compatibility rule

The importer helpers are browser-independent. Legacy UI handlers can migrate to these modules one importer path at a time after parity tests are in place.
