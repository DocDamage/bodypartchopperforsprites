# V7 Library Adapter Codemod

This pass adds a local codemod for the first direct `app.js` library migration.

## Added

```text
scripts/integrate-library-adapter.mjs
tests/library-adapter-codemod-test.mjs
```

## Purpose

`app.js` is still a large legacy runtime file. Direct full-file edits through automation can be risky, so this codemod makes the app migration reproducible and locally reviewable.

The codemod updates two files:

```text
app.js
tests/static-smoke-test.mjs
```

## app.js migration

The codemod:

- imports `createLibraryStorageAdapter` from `src/browser/library-storage-adapter.js`
- creates `libraryStorageAdapter` inside the app module
- replaces legacy `loadLibraryFromStorage()` with `libraryStorageAdapter.loadCanonicalLibrary()`
- replaces legacy `saveLibraryToStorage()` with `libraryStorageAdapter.saveCanonicalLibrary(state.library)`
- removes the fragile undefined `V6_LIBRARY_KEY` dependency from the library load path
- updates `DocSpriteSlicerV7.libraryStorageStatus` when available

## static smoke test migration

The static smoke test already strips one import before parsing `app.js` through `vm.Script`.

After this migration, `app.js` has multiple imports, so the codemod updates the regex to strip all leading import statements before parsing.

## Local usage

Dry run:

```bash
node scripts/integrate-library-adapter.mjs
```

Apply:

```bash
node scripts/integrate-library-adapter.mjs --write
npm test
npm run serve
```

Manual browser checks after applying:

- import asset images into the library
- save selected frame or part as an asset
- import an asset pack
- export/import library JSON
- confirm browser console has `window.DocSpriteSlicerV7.libraryStorageStatus`
- confirm both canonical V7 and legacy v6 library keys stay populated

## Commit suggestion after local application

```bash
git add app.js tests/static-smoke-test.mjs
git commit -m "Use V7 library adapter in browser app"
git push
```
