import { STORAGE_KEYS } from '../core/constants.js';
import { normalizePluginSettings } from '../plugins/builtin-plugins.js';

export function readJson(storage, key, fallback) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(storage, key, value) {
  storage?.setItem?.(key, JSON.stringify(value));
  return value;
}

export function removeKeys(storage, keys = []) {
  for (const key of keys) storage?.removeItem?.(key);
}

export function mergeAssets(existing = [], incoming = []) {
  const map = new Map(existing.map((asset) => [asset.id, asset]));
  for (const asset of incoming) map.set(asset.id, asset);
  return [...map.values()];
}

export function loadLibrary(storage, keys = STORAGE_KEYS) {
  return readJson(storage, keys.library, null)
    || readJson(storage, keys.legacyLibraryV6, null)
    || readJson(storage, keys.legacyLibraryV5, null)
    || readJson(storage, keys.legacyLibraryV4, []);
}

export function saveLibrary(storage, library, keys = STORAGE_KEYS) {
  return writeJson(storage, keys.library, library || []);
}

export function loadPluginSettings(storage, keys = STORAGE_KEYS) {
  return normalizePluginSettings(readJson(storage, keys.pluginSettings, {}));
}

export function savePluginSettings(storage, pluginSettings, keys = STORAGE_KEYS) {
  return writeJson(storage, keys.pluginSettings, normalizePluginSettings(pluginSettings || {}));
}

export function saveAutosaveSnapshot(storage, projectSnapshot, keys = STORAGE_KEYS, options = {}) {
  const maxSlots = options.maxSlots ?? 5;
  const maxRecent = options.maxRecent ?? 10;
  const savedAt = projectSnapshot.savedAt || new Date().toISOString();

  writeJson(storage, keys.autosave, projectSnapshot);

  const slots = readJson(storage, keys.autosaveSlots, []);
  slots.unshift({
    id: options.slotId || `slot_${Date.now().toString(36)}`,
    savedAt,
    name: projectSnapshot.source?.name || projectSnapshot.grid?.baseName || projectSnapshot.recipe?.id || 'sprite_project',
    project: projectSnapshot
  });
  writeJson(storage, keys.autosaveSlots, slots.slice(0, maxSlots));

  const recent = readJson(storage, keys.recentProjects, []);
  recent.unshift({
    savedAt,
    source: projectSnapshot.source?.name || '',
    baseName: projectSnapshot.grid?.baseName || '',
    recipe: projectSnapshot.recipe?.id || ''
  });
  writeJson(storage, keys.recentProjects, recent.slice(0, maxRecent));

  return { savedAt, slotCount: Math.min(slots.length, maxSlots), recentCount: Math.min(recent.length, maxRecent) };
}

export function readRecoveryState(storage, keys = STORAGE_KEYS) {
  return {
    autosave: readJson(storage, keys.autosave, null),
    autosaveSlots: readJson(storage, keys.autosaveSlots, []),
    recentProjects: readJson(storage, keys.recentProjects, []),
    pluginSettings: loadPluginSettings(storage, keys)
  };
}

export function clearRecoveryState(storage, keys = STORAGE_KEYS) {
  removeKeys(storage, [keys.autosave, keys.autosaveSlots, keys.recentProjects]);
}
