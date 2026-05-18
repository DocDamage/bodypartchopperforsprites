# V7 Runtime Shell

This pass adds a safe V7 browser runtime shell without removing the legacy static app runtime.

## Added

```text
src/browser/runtime-shell.js
tests/runtime-shell-test.mjs
```

## Purpose

The runtime shell exposes a V7 global bridge while the current browser app still runs through legacy `app.js`.

This lets future PRs migrate runtime systems gradually instead of replacing the whole app in one risky cutover.

## Current loading behavior

`index.html` loads `src/browser/runtime-shell.js` as an ES module before the legacy `app.js` script.

`app.js` also runs as an ES module and imports shared V7 core constants from `src/core/constants.js`.

The constants migration covers `APP_VERSION`, `CATEGORIES`, `LPC_ROW_LABELS`, and the shared `safeName` helper.

The runtime shell creates and exposes a V7 storage bridge through `window.DocSpriteSlicerV7.storageBridge` plus a compact startup summary through `window.DocSpriteSlicerV7.storageStatus`.

The runtime shell also creates and exposes a focused library adapter through `window.DocSpriteSlicerV7.libraryStorageAdapter` plus `window.DocSpriteSlicerV7.libraryStorageStatus`. During shell boot, legacy v6 library records are synchronized into the canonical V7 library key while keeping the legacy key populated.

Project snapshot migration intentionally remains in the legacy app path until the dedicated project-format migration pass.

The shell still runs in legacy bridge mode: it creates `window.DocSpriteSlicerV7`, exposes V7 metadata, exposes storage and library diagnostics, and patches the visible brand to v7 while the legacy runtime remains responsible for existing app behavior.

## Runtime shell responsibilities

- exposes `DocSpriteSlicerV7` on the browser target
- carries the app version and project format version
- exposes the V7 project schema
- creates a default V7 state object
- exposes the built-in plugin registry
- exposes the V7 storage bridge and storage status summary
- exposes the V7 library adapter and library status summary
- records whether the shell is running in legacy bridge mode
- can patch legacy page branding from v6 to v7

## Compatibility rule

The legacy `app.js` remains active during this pass. The V7 shell is loaded from `index.html`, but it does not replace legacy handlers or mutate legacy runtime state.

Runtime coverage is split between the runtime-shell module test and the static smoke test that confirms the shell module is loaded by the page.

## Next runtime migration steps

1. Replace individual legacy library functions with `window.DocSpriteSlicerV7.libraryStorageAdapter`.
2. Replace remaining legacy storage functions with `window.DocSpriteSlicerV7.storageBridge` or direct imports from `src/browser/storage-bridge.js`.
3. Replace legacy project snapshot/migration logic with `src/state/project-format.js`.
4. Replace legacy validators with `src/validators/*`.
5. Replace legacy exporter metadata builders with `src/exporters/*`.
6. Retire duplicate logic from `app.js` only after parity tests pass.