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
- attaches to `DocSpriteSlicerV7` through the runtime shell
- installs a legacy write sync hook so runtime `localStorage.setItem()` writes for the v6 library key are copied to the V7 canonical key

## Runtime shell exposure

The runtime shell now creates the adapter during boot and exposes:

```text
window.DocSpriteSlicerV7.libraryStorageAdapter
window.DocSpriteSlicerV7.libraryStorageStatus
```

On boot, the shell calls the adapter sync path so existing legacy v6 library data is copied into the V7 canonical key while the v6 key remains populated for legacy `app.js` behavior.

The adapter also watches same-page writes to the legacy v6 library key and mirrors those writes into the canonical V7 key. This means existing legacy `app.js` save paths can continue writing the v6 key while V7 storage stays current.

## Compatibility rule

This pass does not change `app.js` behavior and does not modify `index.html`. The adapter is exposed through the already-loaded runtime shell, so the next integration pass can replace legacy functions with a much smaller diff.

## Test coverage

The adapter test covers:

- loading legacy library data when canonical V7 data is empty
- synchronizing legacy data to the V7 key
- mirroring V7 saves back to the legacy v6 key
- merging canonical and legacy libraries by id
- global/runtime-shell attachment behavior
- legacy v6 library writes syncing to the V7 canonical key
- V7 canonical library writes syncing back to the legacy v6 key
- unavailable-storage fallback behavior

The runtime-shell test covers:

- creating a library adapter with and without browser-like storage
- exposing library adapter status
- syncing legacy library records into canonical storage during shell boot

## Next integration options

1. Manually verify library import/export, part-save-to-library, frame-save-to-library, and asset-pack import still keep both storage keys synchronized.
2. Replace only `loadLibraryFromStorage()` and `saveLibraryToStorage()` in `app.js` with adapter calls.
3. After parity is proven, remove legacy library constants from `app.js`.