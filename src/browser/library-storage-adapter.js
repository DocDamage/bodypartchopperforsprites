import { STORAGE_KEYS } from '../core/constants.js';
import { mergeAssets, readJson, writeJson } from '../state/storage.js';

export function createLibraryStorageAdapter(options = {}) {
  const storage = options.storage || options.target?.localStorage || null;
  const keys = options.keys || STORAGE_KEYS;
  const legacyKeys = options.legacyKeys || [keys.legacyLibraryV6, keys.legacyLibraryV5, keys.legacyLibraryV4].filter(Boolean);
  let syncInstalled = false;

  function readLibrary(key, fallback = null) {
    return readJson(storage, key, fallback);
  }

  function writeLibrary(key, library) {
    return writeJson(storage, key, library || []);
  }

  function loadCanonicalLibrary() {
    const libraries = [];
    const current = readLibrary(keys.library, null);
    if (Array.isArray(current)) libraries.push(current);
    for (const legacyKey of legacyKeys) {
      const legacy = readLibrary(legacyKey, null);
      if (Array.isArray(legacy)) libraries.push(legacy);
    }
    return libraries.reduce((merged, library) => mergeAssets(merged, library), []);
  }

  function saveCanonicalLibrary(library) {
    const normalized = Array.isArray(library) ? library : [];
    writeLibrary(keys.library, normalized);
    if (keys.legacyLibraryV6) writeLibrary(keys.legacyLibraryV6, normalized);
    return normalized;
  }

  function syncLibraryStorage() {
    const merged = loadCanonicalLibrary();
    saveCanonicalLibrary(merged);
    return merged;
  }

  function installLegacyWriteSync(target = globalThis) {
    if (!storage || syncInstalled || typeof storage.setItem !== 'function') return false;
    const originalSetItem = storage.setItem.bind(storage);
    storage.setItem = (key, value) => {
      const result = originalSetItem(key, value);
      if (key === keys.legacyLibraryV6 || key === keys.library) {
        try {
          const merged = loadCanonicalLibrary();
          const serialized = JSON.stringify(merged);
          if (key !== keys.library) originalSetItem(keys.library, serialized);
          if (keys.legacyLibraryV6 && key !== keys.legacyLibraryV6) originalSetItem(keys.legacyLibraryV6, serialized);
          if (target?.DocSpriteSlicerV7) {
            target.DocSpriteSlicerV7.libraryStorageStatus = status();
          }
        } catch {
          // Keep legacy writes non-blocking.
        }
      }
      return result;
    };
    syncInstalled = true;
    return true;
  }

  function status() {
    const canonical = readLibrary(keys.library, []);
    const legacyV6 = keys.legacyLibraryV6 ? readLibrary(keys.legacyLibraryV6, []) : [];
    return {
      available: Boolean(storage),
      canonicalKey: keys.library,
      legacyKey: keys.legacyLibraryV6 || '',
      canonicalAssets: Array.isArray(canonical) ? canonical.length : 0,
      legacyAssets: Array.isArray(legacyV6) ? legacyV6.length : 0,
      synchronized: JSON.stringify(canonical || []) === JSON.stringify(legacyV6 || []),
      legacyWriteSyncInstalled: syncInstalled
    };
  }

  return {
    available: Boolean(storage),
    keys,
    legacyKeys,
    loadCanonicalLibrary,
    saveCanonicalLibrary,
    syncLibraryStorage,
    installLegacyWriteSync,
    status
  };
}

export function installLibraryStorageAdapter(target = globalThis, options = {}) {
  const adapter = createLibraryStorageAdapter({ target, ...options });
  if (adapter.available) {
    adapter.syncLibraryStorage();
    adapter.installLegacyWriteSync(target);
  }
  target.DocSpriteSlicerV7LibraryStorageAdapter = adapter;
  if (target.DocSpriteSlicerV7) {
    target.DocSpriteSlicerV7.libraryStorageAdapter = adapter;
    target.DocSpriteSlicerV7.libraryStorageStatus = adapter.status();
  }
  return adapter;
}