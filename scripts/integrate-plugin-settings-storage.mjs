import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const STORAGE_IMPORT = "import { createStorageBridge } from './src/browser/storage-bridge.js';";
const STORAGE_CONST = "  const v7StorageBridge = createStorageBridge({ target: window });";

const LEGACY_PLUGIN_READ = `      const rawPlugins = localStorage.getItem(PLUGIN_SETTINGS_KEY);
      if (rawPlugins) state.plugins.enabled = { ...DEFAULT_PLUGIN_SETTINGS, ...JSON.parse(rawPlugins) };`;

const BRIDGE_PLUGIN_READ = `      state.plugins.enabled = v7StorageBridge.loadPluginSettings();`;

const LEGACY_PLUGIN_SAVE = `  function savePluginSettings() { try { localStorage.setItem(PLUGIN_SETTINGS_KEY, JSON.stringify(state.plugins.enabled)); } catch {} }`;

const BRIDGE_PLUGIN_SAVE = `  function savePluginSettings() {
    try {
      v7StorageBridge.savePluginSettings(state.plugins.enabled);
      if (window.DocSpriteSlicerV7) {
        window.DocSpriteSlicerV7.pluginSettings = v7StorageBridge.loadPluginSettings();
        window.DocSpriteSlicerV7.storageStatus = window.DocSpriteSlicerV7.storageBridge?.readRecoveryState ? window.DocSpriteSlicerV7.storageStatus : window.DocSpriteSlicerV7.storageStatus;
      }
    } catch {}
  }`;

export function integratePluginSettingsStorage(source) {
  let output = source;
  let changed = false;

  if (!output.includes(STORAGE_IMPORT)) {
    const importPattern = /import .*? from '\.\/src\/browser\/library-storage-adapter\.js';/;
    if (!importPattern.test(output)) throw new Error('Could not find library storage adapter import in app.js. Run library adapter codemod first.');
    output = output.replace(importPattern, (match) => `${match}\n${STORAGE_IMPORT}`);
    changed = true;
  }

  if (!output.includes(STORAGE_CONST)) {
    const anchor = '  const libraryStorageAdapter = createLibraryStorageAdapter({ target: window });';
    if (!output.includes(anchor)) throw new Error('Could not find libraryStorageAdapter anchor in app.js.');
    output = output.replace(anchor, `${anchor}\n${STORAGE_CONST}`);
    changed = true;
  }

  if (output.includes(LEGACY_PLUGIN_READ)) {
    output = output.replaceAll(LEGACY_PLUGIN_READ, BRIDGE_PLUGIN_READ);
    changed = true;
  } else if (!output.includes('v7StorageBridge.loadPluginSettings()')) {
    throw new Error('Could not find legacy plugin settings read or existing bridge read in app.js.');
  }

  if (output.includes(LEGACY_PLUGIN_SAVE)) {
    output = output.replace(LEGACY_PLUGIN_SAVE, BRIDGE_PLUGIN_SAVE);
    changed = true;
  } else if (!output.includes('v7StorageBridge.savePluginSettings(state.plugins.enabled)')) {
    throw new Error('Could not find legacy savePluginSettings function or existing bridge save in app.js.');
  }

  return { output, changed };
}

function applyFile(relativePath, transformer, write) {
  const filePath = path.join(root, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const result = transformer(source);
  if (write && result.changed) fs.writeFileSync(filePath, result.output);
  return { relativePath, ...result };
}

export function runIntegration({ write = false } = {}) {
  const results = [applyFile('app.js', integratePluginSettingsStorage, write)];
  return { changed: results.some((result) => result.changed), results };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  const result = runIntegration({ write });
  for (const item of result.results) console.log(`${item.changed ? 'CHANGED' : 'OK'} ${item.relativePath}`);
  if (!write && result.changed) console.log('\nDry run only. Re-run with --write to update files.');
}
