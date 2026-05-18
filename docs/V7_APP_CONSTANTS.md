# V7 Browser App Constants Migration

This pass moves the legacy browser app onto shared V7 core constants without rewriting the rest of the browser runtime.

## Updated

```text
app.js
index.html
tests/static-smoke-test.mjs
docs/V7_RUNTIME_SHELL.md
```

## What changed

- `app.js` now runs as an ES module.
- `app.js` imports `APP_VERSION`, `CATEGORIES`, `LPC_ROW_LABELS`, and `safeName` from `src/core/constants.js`.
- `index.html` loads `app.js` with `type="module"`.
- The static smoke test confirms the module script wiring and verifies that the app uses shared core constants.

## Intentional non-goals

This pass does not migrate:

- storage key behavior
- autosave/recovery behavior
- project snapshot format
- project migration logic
- plugin registry data
- export profile data

Those systems still have dedicated module implementations in `src/`, but moving them into the browser runtime should happen in smaller parity-tested passes.

## Compatibility notes

The app remains wrapped in its legacy runtime closure, so the browser-facing behavior stays isolated.

Because the runtime shell already requires module loading, serving the app through the local static server remains the expected manual test path.

Run `npm test` after applying this pass.
