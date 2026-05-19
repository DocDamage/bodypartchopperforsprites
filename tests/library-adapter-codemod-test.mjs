import { integrateAppLibraryAdapter, integrateStaticSmokeTest } from '../scripts/integrate-library-adapter.mjs';

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

(() => {
  'use strict';

  const VERSION = APP_VERSION;
  const LIBRARY_KEY = 'doc_sprite_slicer_studio_v6_asset_library';
  const PLUGIN_SETTINGS_KEY = 'doc_sprite_slicer_studio_v6_plugin_settings';
  const CATEGORIES = CORE_CATEGORIES;
  const LPC_ROW_LABELS = CORE_LPC_ROW_LABELS;

  const state = { library: [], plugins: { enabled: {} } };
  const DEFAULT_PLUGIN_SETTINGS = {};
  function toast() {}

  function loadLibraryFromStorage() {
    try {
      state.library = JSON.parse(localStorage.getItem(LIBRARY_KEY) || localStorage.getItem(V6_LIBRARY_KEY) || '[]');
      const rawPlugins = localStorage.getItem(PLUGIN_SETTINGS_KEY);
      if (rawPlugins) state.plugins.enabled = { ...DEFAULT_PLUGIN_SETTINGS, ...JSON.parse(rawPlugins) };
    } catch { state.library = []; }
  }
  function saveLibraryToStorage() {
    try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(state.library)); } catch (err) { toast('Library is too large for browser local storage. Export it as JSON.', 'warn'); }
  }
})();`;

const appResult = integrateAppLibraryAdapter(appFixture);
assert(appResult.changed === true, 'codemod reports app.js changed');
assert(appResult.output.includes("import { createLibraryStorageAdapter } from './src/browser/library-storage-adapter.js';"), 'codemod adds library adapter import');
assert(appResult.output.includes('const libraryStorageAdapter = createLibraryStorageAdapter({ target: window });'), 'codemod adds adapter constant');
assert(appResult.output.includes('libraryStorageAdapter.loadCanonicalLibrary()'), 'codemod replaces library load path');
assert(appResult.output.includes('libraryStorageAdapter.saveCanonicalLibrary(state.library)'), 'codemod replaces library save path');
assert(!appResult.output.includes('V6_LIBRARY_KEY'), 'codemod removes undefined V6_LIBRARY_KEY reference');

const secondAppResult = integrateAppLibraryAdapter(appResult.output);
assert(secondAppResult.changed === false, 'codemod is idempotent for app.js');

const smokeFixture = "try {\n  const appScriptBody = app.replace(/^import[\\s\\S]*?;\\n\\n/, '');\n  new vm.Script(appScriptBody, { filename: 'app.js' });\n}";
const smokeResult = integrateStaticSmokeTest(smokeFixture);
assert(smokeResult.changed === true, 'codemod reports smoke test changed');
assert(smokeResult.output.includes('/^(?:import[\\s\\S]*?;\\n\\s*)+/'), 'codemod updates smoke test import stripping regex');

const secondSmokeResult = integrateStaticSmokeTest(smokeResult.output);
assert(secondSmokeResult.changed === false, 'codemod is idempotent for smoke test');

if (process.exitCode) process.exit(process.exitCode);
