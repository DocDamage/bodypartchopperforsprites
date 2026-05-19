import { integratePluginSettingsStorage } from '../scripts/integrate-plugin-settings-storage.mjs';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const appFixture = `import {
  APP_VERSION,
  CATEGORIES as CORE_CATEGORIES,
  LPC_ROW_LABELS as CORE_LPC_ROW_LABELS,
  safeName as coreSafeName
} from './src/core/constants.js';
import { createLibraryStorageAdapter } from './src/browser/library-storage-adapter.js';

(() => {
  'use strict';

  const VERSION = APP_VERSION;
  const PLUGIN_SETTINGS_KEY = 'doc_sprite_slicer_studio_v6_plugin_settings';
  const CATEGORIES = CORE_CATEGORIES;
  const LPC_ROW_LABELS = CORE_LPC_ROW_LABELS;

  const libraryStorageAdapter = createLibraryStorageAdapter({ target: window });
  const DEFAULT_PLUGIN_SETTINGS = {};
  const state = { plugins: { enabled: {} } };

  function loadLibraryFromStorage() {
    try {
      state.library = libraryStorageAdapter.loadCanonicalLibrary();
      const rawPlugins = localStorage.getItem(PLUGIN_SETTINGS_KEY);
      if (rawPlugins) state.plugins.enabled = { ...DEFAULT_PLUGIN_SETTINGS, ...JSON.parse(rawPlugins) };
      if (window.DocSpriteSlicerV7) window.DocSpriteSlicerV7.libraryStorageStatus = libraryStorageAdapter.status();
    } catch {
      state.library = [];
    }
  }

  function savePluginSettings() { try { localStorage.setItem(PLUGIN_SETTINGS_KEY, JSON.stringify(state.plugins.enabled)); } catch {} }
})();`;

const result = integratePluginSettingsStorage(appFixture);
assert(result.changed === true, 'plugin settings codemod reports app.js changed');
assert(result.output.includes("import { createStorageBridge } from './src/browser/storage-bridge.js';"), 'codemod adds storage bridge import');
assert(result.output.includes('const v7StorageBridge = createStorageBridge({ target: window });'), 'codemod adds storage bridge constant');
assert(result.output.includes('state.plugins.enabled = v7StorageBridge.loadPluginSettings();'), 'codemod replaces plugin settings load path');
assert(result.output.includes('v7StorageBridge.savePluginSettings(state.plugins.enabled);'), 'codemod replaces plugin settings save path');
assert(!result.output.includes('localStorage.setItem(PLUGIN_SETTINGS_KEY'), 'codemod removes direct plugin setting localStorage write');

const secondResult = integratePluginSettingsStorage(result.output);
assert(secondResult.changed === false, 'plugin settings codemod is idempotent');

if (process.exitCode) process.exit(process.exitCode);
