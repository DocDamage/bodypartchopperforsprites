# V7 Storage Bridge

This pass adds a browser-facing storage bridge around the pure V7 storage helpers.

## Added

```text
src/browser/storage-bridge.js
tests/storage-bridge-test.mjs
```

## Purpose

The existing legacy browser runtime still owns its storage calls inside `app.js`. This bridge creates a tested boundary for migrating those calls safely instead of replacing every localStorage path at once.

The V7 runtime shell exposes the bridge at `window.DocSpriteSlicerV7.storageBridge` and exposes startup diagnostics at `window.DocSpriteSlicerV7.storageStatus`.

## Bridge responsibilities

- resolve browser `localStorage` from a supplied target
- expose V7 storage keys from `src/core/constants.js`
- wrap JSON read/write helpers
- load and save asset library records
- load and save normalized plugin settings
- save autosave snapshots with bounded autosave slots and recent-project history
- read and clear recovery state
- build a compact storage status summary for diagnostics/UI work

## Compatibility rule

The bridge is available through the V7 shell, but legacy `app.js` storage calls are not replaced yet. The next pass can replace individual legacy storage functions with calls to `createStorageBridge()` or `window.DocSpriteSlicerV7.storageBridge` after parity checks are in place.

## Test coverage

The storage bridge test covers:

- browser storage resolution
- missing-storage fallback behavior
- JSON read/write
- library save/load
- plugin settings normalization and persistence
- autosave snapshot writing
- recovery state reading
- storage status summary building
- recovery-state clearing

The runtime-shell test covers:

- shell creation with unavailable storage
- shell creation with supplied browser-like storage
- shell boot attaching a storage bridge to `DocSpriteSlicerV7`

## Next storage migration steps

1. Replace legacy `loadLibraryFromStorage()` and `saveLibraryToStorage()` with bridge calls.
2. Replace legacy plugin setting persistence with bridge calls.
3. Replace autosave slot read/write paths with bridge calls.
4. Replace recovery-package reads with bridge calls.
5. Move legacy storage constants out of `app.js` once all consumers use V7 `STORAGE_KEYS`.
