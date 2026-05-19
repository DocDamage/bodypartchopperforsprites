# Fix Comma-Delimited Inputs

This pass adds a local codemod for the row-label, direction-label, and frame-cycle input bug.

## Bug

Typing a comma into these fields immediately removes the comma:

```text
Row Labels
Direction Labels
Frame Cycle
```

## Root cause

The shared input handler calls `renderAll()` on every keystroke.

`renderAll()` calls `syncToInputs()`, which rewrites comma-delimited fields from parsed state:

```js
els.rowLabelsInput.value = state.grid.rowLabels.join(',');
els.directionLabelsInput.value = state.grid.directionLabels.join(',');
els.frameCycleInput.value = state.anim.cycle.join(',');
```

While typing `up,`, parsing turns that into `['up']`, then `syncToInputs()` rewrites the field back to `up`, so the comma disappears.

## Fix

The codemod:

- changes live input renders to `renderAll({ preserveEditing: true })`
- lets `renderAll()` forward options into `syncToInputs()`
- lets `syncToInputs()` detect `document.activeElement`
- prevents active comma-delimited fields from being rewritten while the user is typing

## Added

```text
scripts/fix-comma-delimited-inputs.mjs
tests/comma-delimited-inputs-codemod-test.mjs
```

## Local usage

Dry run:

```bash
node scripts/fix-comma-delimited-inputs.mjs
```

Apply:

```bash
node scripts/fix-comma-delimited-inputs.mjs --write
npm test
npm run serve
```

Manual check:

- type `up,left,down,right` into Direction Labels
- type comma-separated Row Labels
- type comma-separated Frame Cycle
- confirm commas remain while typing
- tab/click away and confirm state sync still works
