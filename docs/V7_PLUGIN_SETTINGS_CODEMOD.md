# V7 Plugin Settings Codemod

This pass adds a local codemod for migrating plugin settings persistence from direct legacy `localStorage` calls to the V7 storage bridge.

## Added

```text
scripts/integrate-plugin-settings-storage.mjs
tests/plugin-settings-codemod-test.mjs
```

## Purpose

`app.js` is still a large legacy runtime file. This codemod makes the plugin-settings migration reproducible and locally reviewable before committing direct runtime changes.

## app.js migration

The codemod:

- imports `createStorageBridge` from `src/browser/storage-bridge.js`
- creates `v7StorageBridge` inside the app module
- replaces plugin setting reads with `v7StorageBridge.loadPluginSettings()`
- replaces plugin setting saves with `v7StorageBridge.savePluginSettings(state.plugins.enabled)`
- updates `window.DocSpriteSlicerV7.pluginSettings` when available

## Local usage

Dry run:

```bash
node scripts/integrate-plugin-settings-storage.mjs
```

Apply:

```bash
node scripts/integrate-plugin-settings-storage.mjs --write
npm test
npm run serve
```

Manual browser checks after applying:

- open Plugin Manager
- disable one plugin
- refresh the page
- confirm the plugin setting persists
- re-enable all plugins
- confirm the app still loads and menus respond

## Commit suggestion after local application

```bash
git add app.js
git commit -m "Use V7 storage bridge for plugin settings"
git push
```
