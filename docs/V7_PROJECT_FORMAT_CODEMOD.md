# V7 Project Format Codemod

This pass adds a local codemod for migrating legacy `app.js` project snapshot and project migration logic to `src/state/project-format.js`.

## Added

```text
scripts/integrate-project-format.mjs
tests/project-format-codemod-test.mjs
```

## Purpose

`app.js` still contains legacy V6 project snapshot and migration logic. The V7 project-format module already provides canonical helpers, but direct large-file edits should happen locally through a tested codemod.

## app.js migration

The codemod:

- imports `createProjectSnapshot` and `migrateProject` from `src/state/project-format.js` under V7 aliases
- removes the legacy `PROJECT_SCHEMA_V6` marker
- replaces legacy `projectSnapshot()` with `createV7ProjectSnapshot(state, { includeLibrary })`
- replaces legacy `migrateProject()` with `migrateV7Project(project)`
- updates the static smoke test to expect V7 project-format helpers instead of the V6 schema marker

## Local usage

Dry run:

```bash
node scripts/integrate-project-format.mjs
```

Apply:

```bash
node scripts/integrate-project-format.mjs --write
npm test
npm run serve
```

Manual browser checks after applying:

- save project
- open the saved project
- open an older v6/v5 project if available
- confirm autosave/recovery still works
- confirm library and plugin settings still persist

## Commit suggestion after local application

```bash
git add app.js tests/static-smoke-test.mjs
git commit -m "Use V7 project format helpers in browser app"
git push
```
