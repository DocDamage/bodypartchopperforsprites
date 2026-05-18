# V7 Canvas Core

This pass continues the V7 architecture split by extracting browser-independent canvas math, selection, bounding-box, and part-transform helpers.

## Added modules

```text
src/canvas/bbox.js
src/canvas/selection.js
src/canvas/parts.js
```

## Bounding-box helpers

`src/canvas/bbox.js` owns:

- alpha-based bounding-box calculation
- frame-edge touch checks
- center and bottom-center calculations
- frame box summary statistics

## Selection helpers

`src/canvas/selection.js` owns:

- selecting parts by point
- selecting pivots by point
- selecting the top object at a source-space point
- selection label formatting

## Part helpers

`src/canvas/parts.js` owns:

- cloning a part to another frame
- mirroring a part inside its frame
- creating humanoid starter region definitions

## Compatibility rule

The browser UI still runs through legacy `app.js`. These helpers are tested independently first so canvas runtime behavior can be migrated safely later.
