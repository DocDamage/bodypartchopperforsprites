import { STORAGE_KEYS } from '../core/constants.js';
import {
  clearRecoveryState,
  loadLibrary,
  loadPluginSettings,
  readJson,
  readRecoveryState,
  saveAutosaveSnapshot,
  saveLibrary,
  savePluginSettings,
  writeJson
} from '../state/storage.js';

export function resolveBrowserStorage(target = globalThis) {
  return target?.localStorage || null;
}

export function createStorageBridge(options = {}) {
  const storage = options.storage || resolveBrowserStorage(options.target);
  const keys = options.keys || STORAGE_KEYS;

  return {
    keys,
    storage,
    available: Boolean(storage),
    readJson: (key, fallback = null) => readJson(storage, key, fallback),
    writeJson: (key, value) => writeJson(storage, key, value),
    loadLibrary: () => loadLibrary(storage, keys),
    saveLibrary: (library) => saveLibrary(storage, library, keys),
    loadPluginSettings: () => loadPluginSettings(storage, keys),
    savePluginSettings: (settings) => savePluginSettings(storage, settings, keys),
    saveAutosaveSnapshot: (snapshot, autosaveOptions = {}) => saveAutosaveSnapshot(storage, snapshot, keys, autosaveOptions),
    readRecoveryState: () => readRecoveryState(storage, keys),
    clearRecoveryState: () => clearRecoveryState(storage, keys)
  };
}

export function buildStorageStatus(bridge = createStorageBridge()) {
  const recovery = bridge.readRecoveryState();
  return {
    available: bridge.available,
    hasAutosave: Boolean(recovery.autosave),
    autosaveSlots: recovery.autosaveSlots.length,
    recentProjects: recovery.recentProjects.length,
    pluginSettings: Object.keys(recovery.pluginSettings || {}).length,
    libraryAssets: bridge.loadLibrary().length
  };
}
