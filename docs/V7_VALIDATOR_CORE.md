# V7 Validator Core

This pass continues the V7 architecture split by moving validator logic into pure, testable modules.

## Added modules

```text
src/validators/project-integrity.js
src/validators/visual-diff.js
src/validators/timeline.js
```

## Project integrity validator

Checks:

- runtime/project version mismatch
- missing or invalid grid settings
- missing export profile
- recipe layers pointing to missing library assets
- unknown plugin settings
- missing source/library assets
- missing license metadata

## Visual diff validator

Checks visual summary data for:

- center drift
- height drift
- empty cells

Also exports a Markdown report builder for visual QA diff output.

## Timeline validator

Checks timeline clips for:

- missing frames
- row references outside current grid
- frame columns outside current grid
- zero or negative durations
- large duration variance

## Compatibility rule

The browser UI still runs through legacy `app.js`. These validators are now independently tested so legacy runtime validation can be replaced one validator at a time.
