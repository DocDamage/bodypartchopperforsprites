import { STORAGE_KEYS } from '../src/core/constants.js';
import { buildStorageStatus, createStorageBridge, resolveBrowserStorage } from '../src/browser/storage-bridge.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key)
  };
}

const memoryStorage = createMemoryStorage();
const target = { localStorage: memoryStorage };

assert(resolveBrowserStorage(target) === memoryStorage, 'resolveBrowserStorage returns target localStorage');
assert(resolveBrowserStorage({}) === null, 'resolveBrowserStorage returns null without storage');

const bridge = createStorageBridge({ target });
assert(bridge.available === true, 'createStorageBridge reports storage available');
assert(bridge.keys.autosave === STORAGE_KEYS.autosave, 'createStorageBridge uses V7 storage keys');

bridge.writeJson('example', { ok: true });
assert(bridge.readJson('example', {}).ok === true, 'storage bridge reads and writes JSON');

bridge.saveLibrary([{ id: 'asset_1', name: 'Ronin Hair' }]);
assert(bridge.loadLibrary()[0].id === 'asset_1', 'storage bridge saves and loads library');

const plugins = bridge.loadPluginSettings();
assert(plugins['validator.project_integrity'] === true, 'storage bridge loads normalized plugin settings');
bridge.savePluginSettings({ 'validator.visual_diff': false });
assert(bridge.loadPluginSettings()['validator.visual_diff'] === false, 'storage bridge saves plugin setting overrides');

const result = bridge.saveAutosaveSnapshot({
  savedAt: '2026-05-18T22:00:00.000Z',
  source: { name: 'ronin.png' },
  grid: { baseName: 'ronin' },
  recipe: { id: 'ronin_recipe' }
}, { slotId: 'slot_test' });
assert(result.slotCount === 1, 'storage bridge creates autosave slot');

const recovery = bridge.readRecoveryState();
assert(recovery.autosave.source.name === 'ronin.png', 'storage bridge reads latest autosave');
assert(recovery.autosaveSlots[0].id === 'slot_test', 'storage bridge reads autosave slots');
assert(recovery.recentProjects[0].source === 'ronin.png', 'storage bridge reads recent projects');

const status = buildStorageStatus(bridge);
assert(status.available === true, 'storage status reports availability');
assert(status.hasAutosave === true, 'storage status detects autosave');
assert(status.autosaveSlots === 1, 'storage status counts autosave slots');
assert(status.libraryAssets === 1, 'storage status counts library assets');

bridge.clearRecoveryState();
assert(bridge.readRecoveryState().autosaveSlots.length === 0, 'storage bridge clears recovery slots');
assert(bridge.readRecoveryState().autosave === null, 'storage bridge clears latest autosave');

const unavailableBridge = createStorageBridge({ storage: null });
assert(unavailableBridge.available === false, 'storage bridge reports unavailable storage');
assert(Array.isArray(unavailableBridge.loadLibrary()), 'unavailable bridge falls back to empty library');

if (process.exitCode) process.exit(process.exitCode);
