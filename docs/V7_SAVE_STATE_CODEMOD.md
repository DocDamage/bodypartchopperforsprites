# V7 Save State Codemod

This pass adds a local codemod for migrating autosave, autosave slots, recent projects, and recovery-package reads from direct legacy `localStorage` calls to the V7 storage bridge.

## Added

```text
scripts/integrate-save-state-storage.mjs
tests/save-state-codemod-test.mjs
```

## Purpose

`app.js` remains a large legacy runtime file. This codemod makes the save-state migration reproducible and locally reviewable before committing direct runtime changes.

## app.js migration

The codemod replaces:

- `recoverAutosave()`
- `saveAutosaveSnapshot()`
- `restoreLatestAutosaveSlot()`
- `clearRecoveryData()`
- `exportRecoveryPackage()`

with V7 storage bridge-backed implementations.

## Local usage

Dry run:

```bash
node scripts/integrate-save-state-storage.mjs
```

Apply:

```bash
node scripts/integrate-save-state-storage.mjs --write
npm test
npm run serve
```

Manual browser checks after applying:

- wait for autosave or trigger save flows
- recover autosave
- export recovery package
- clear recovery data
- verify plugin settings still persist
- verify library saves still persist

## Commit suggestion after local application

```bash
git add app.js
git commit -m "Use V7 storage bridge for save state"
git push
```
