# Remaining V7 Import Core Patch

GitHub write access became read-only before I could push the final importer-core pass.

Apply these file changes on top of current `main`:

- Add `src/importers/asset-pack.js`
- Add `src/importers/spritesheet.js`
- Add `tests/importer-module-test.mjs`
- Replace `tests/all-tests.mjs` with the included version so importer tests run
- Replace `src/index.js` with the included version so importer modules are exported

Then run:

```bash
npm test
```

Recommended commit message:

```text
Add V7 importer core modules
```

Recommended PR summary:

```text
Adds pure importer modules for asset packs and spritesheets, plus importer module tests and src/index exports.
```
