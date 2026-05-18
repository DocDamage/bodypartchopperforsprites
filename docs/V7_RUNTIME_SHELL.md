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

## Runtime shell responsibilities

- exposes `DocSpriteSlicerV7` on the browser target
- carries the app version and project format version
- exposes the V7 project schema
- creates a default V7 state object
- exposes the built-in plugin registry
- records whether the shell is running in legacy bridge mode
- can patch legacy page branding from v6 to v7

## Compatibility rule

The legacy `app.js` remains active during this pass. The shell is tested in isolation first.

## Next runtime migration steps

1. Load the shell from `index.html` before or after legacy `app.js`.
2. Replace legacy constants with imports from `src/core/constants.js`.
3. Replace legacy project snapshot/migration logic with `src/state/project-format.js`.
4. Replace legacy storage logic with `src/state/storage.js`.
5. Replace legacy validators with `src/validators/*`.
6. Replace legacy exporter metadata builders with `src/exporters/*`.
7. Retire duplicate logic from `app.js` only after parity tests pass.
