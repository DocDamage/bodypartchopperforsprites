# V7 State Core

This pass continues the V7 architecture split by moving browser-independent state helpers into pure modules.

## Added modules

```text
src/state/storage.js
src/state/history.js
src/state/backup.js
```

## Storage helpers

`src/state/storage.js` owns:

- safe JSON read/write helpers
- asset library loading and saving
- legacy library fallback loading
- plugin settings loading and saving
- autosave snapshot writing
- autosave slot and recent project tracking
- recovery state reading and clearing

## History helpers

`src/state/history.js` owns:

- history state creation
- undo stack push
- undo/redo availability checks
- undo/redo snapshot popping

## Backup helpers

`src/state/backup.js` owns:

- timestamped backup filename generation
- recovery package file manifest generation

## Compatibility rule

The browser UI still runs through legacy `app.js`. These helpers are tested independently first so the legacy state logic can be replaced in small follow-up PRs.
