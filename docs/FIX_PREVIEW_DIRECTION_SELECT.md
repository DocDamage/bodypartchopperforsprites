# Fix Preview Direction Select

This pass adds a local codemod for the Animation Preview direction dropdown bug.

## Bug

Changing the Preview Row dropdown does not change the displayed sprite direction.

## Root cause

`syncFromInputs()` already reads `els.previewRowSelect.value`, and `drawPreviewFrame()` already uses `state.anim.previewRow`.

However, `previewRowSelect` is not registered in the live input listener list, so selecting a new row does not call:

```js
syncFromInputs();
renderAll();
draw();
```

## Fix

The codemod:

- adds `els.previewRowSelect` to the non-text input listener list
- rewrites `renderPreviewRowSelect()` so it avoids unnecessary option rewrites
- keeps the selected preview row stable while redrawing

## Added

```text
scripts/fix-preview-direction-select.mjs
tests/preview-direction-codemod-test.mjs
```

## Local usage

Dry run:

```bash
node scripts/fix-preview-direction-select.mjs
```

Apply:

```bash
node scripts/fix-preview-direction-select.mjs --write
npm test
npm run serve
```

Manual check:

- load a multi-row spritesheet
- open Animate mode
- change Preview Row dropdown
- confirm the preview sprite changes row/direction immediately
