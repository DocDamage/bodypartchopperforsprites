# V7 Export Core

This pass continues the V7 architecture split by moving export-adjacent pure logic into testable modules.

## Added modules

```text
src/exporters/manifest.js
src/exporters/credits.js
```

## Manifest module

`src/exporters/manifest.js` owns deterministic export metadata helpers:

- frame path construction
- frame manifest construction
- animation manifest fallback generation
- export preview construction
- row-label animation/direction inference

These helpers are pure and do not touch the DOM, canvas, browser downloads, or local storage.

## Credits module

`src/exporters/credits.js` owns credit and license metadata helpers:

- recipe asset collection
- Markdown credits generation
- CSV credits generation
- CSV escaping

## Compatibility rule

The browser UI still runs through legacy `app.js`. These modules are used by tests first so we can migrate runtime export code safely later.

## Next safe step

Move runtime export actions from legacy `app.js` to module-backed calls one exporter at a time:

1. manifest preview
2. credits export
3. runtime bundle export
4. frame manifest export
5. workspace ZIP manifest wiring
