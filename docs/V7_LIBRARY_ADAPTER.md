# V7 Library Adapter

This pass adds a focused library adapter for synchronizing V7 canonical library records with the current legacy v6 browser library key.

## Added

```text
src/browser/library-storage-adapter.js
tests/library-storage-adapter-test.mjs
```

## Purpose

The legacy browser app still reads and writes the v6 library key internally. The V7 storage bridge already owns canonical V7 storage helpers, but directly rewriting `app.js` library functions is risky while the file is still large and legacy-driven.

The adapter provides a tested compatibility layer first:

- reads canonical V7 library records
- reads legacy v6, v5, and v4 library records
- merges records by asset id
- writes the merged result to the canonical V7 key
- mirrors the result back to the legacy v6 key so existing app behavior remains intact
- can attach itself to `DocSpriteSlicerV7` when the runtime shell exists

## Compatibility rule

This pass does not change `app.js` behavior and does not modify `index.html`. The adapter is intentionally module/test/doc only so the next integration pass can wire it into the page or legacy functions with a much smaller diff.

## Test coverage

The adapter test covers:

- loading legacy library data when canonical V7 data is empty
- synchronizing legacy data to the V7 key
- mirroring V7 saves back to the legacy v6 key
- merging canonical and legacy libraries by id
- global/runtime-shell attachment behavior
- unavailable-storage fallback behavior

## Next integration options

1. Load the adapter from `index.html` before `app.js`, then manually verify legacy library import/export still works.
2. Replace only `loadLibraryFromStorage()` and `saveLibraryToStorage()` in `app.js` with adapter calls.
3. After parity is proven, remove legacy library constants from `app.js`.
