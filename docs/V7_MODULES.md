# V7 Modules

V7 starts the architecture split while keeping the current static browser app stable.

## Added module areas

```text
src/core
src/canvas
src/exporters
src/plugins
src/state
src/validators
```

## First extracted systems

- constants and shared helpers
- export profile defaults
- plugin registry defaults
- default state factories
- project snapshot and migration helpers
- frame and grid math helpers
- QA diagnostic helpers
- runtime bundle builder

## Tests

```text
tests/static-smoke-test.mjs
tests/core-module-test.mjs
tests/all-tests.mjs
```

The current browser UI still loads the legacy `app.js`. Later V7 work should move runtime code onto the new modules one section at a time.
