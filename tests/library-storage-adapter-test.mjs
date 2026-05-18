import { STORAGE_KEYS } from '../src/core/constants.js';
import { createLibraryStorageAdapter, installLibraryStorageAdapter } from '../src/browser/library-storage-adapter.js';
import { readJson } from '../src/state/storage.js';

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

const storage = createMemoryStorage();
storage.setItem(STORAGE_KEYS.legacyLibraryV6, JSON.stringify([{ id: 'legacy_asset', name: 'Legacy Hair' }]));

const adapter = createLibraryStorageAdapter({ storage });
assert(adapter.available === true, 'adapter reports storage available');
assert(adapter.loadCanonicalLibrary()[0].id === 'legacy_asset', 'adapter loads legacy library when canonical is empty');

const synced = adapter.syncLibraryStorage();
assert(synced.length === 1, 'adapter sync returns merged library');
assert(readJson(storage, STORAGE_KEYS.library, [])[0].id === 'legacy_asset', 'adapter writes canonical V7 library key');
assert(readJson(storage, STORAGE_KEYS.legacyLibraryV6, [])[0].id === 'legacy_asset', 'adapter preserves legacy v6 library key');

adapter.saveCanonicalLibrary([
  { id: 'legacy_asset', name: 'Legacy Hair Updated' },
  { id: 'new_asset', name: 'New Cloak' }
]);
assert(readJson(storage, STORAGE_KEYS.library, []).length === 2, 'adapter saves canonical library asset count');
assert(readJson(storage, STORAGE_KEYS.legacyLibraryV6, []).length === 2, 'adapter mirrors saves to legacy v6 key');
assert(adapter.status().synchronized === true, 'adapter status reports synchronized keys after save');
assert(adapter.status().canonicalAssets === 2, 'adapter status counts canonical assets');

const mixedStorage = createMemoryStorage();
mixedStorage.setItem(STORAGE_KEYS.library, JSON.stringify([{ id: 'asset_a', name: 'A' }]));
mixedStorage.setItem(STORAGE_KEYS.legacyLibraryV6, JSON.stringify([{ id: 'asset_b', name: 'B' }, { id: 'asset_a', name: 'A Override' }]));
const mixedAdapter = createLibraryStorageAdapter({ storage: mixedStorage });
const mixed = mixedAdapter.syncLibraryStorage();
assert(mixed.length === 2, 'adapter merges canonical and legacy assets');
assert(mixed.find((asset) => asset.id === 'asset_a').name === 'A Override', 'adapter lets later legacy assets update matching ids during merge');

const target = { localStorage: createMemoryStorage(), DocSpriteSlicerV7: {} };
target.localStorage.setItem(STORAGE_KEYS.legacyLibraryV6, JSON.stringify([{ id: 'installed_asset', name: 'Installed' }]));
const installed = installLibraryStorageAdapter(target);
assert(target.DocSpriteSlicerV7LibraryStorageAdapter === installed, 'installLibraryStorageAdapter exposes adapter globally');
assert(target.DocSpriteSlicerV7.libraryStorageAdapter === installed, 'installLibraryStorageAdapter attaches adapter to runtime shell when present');
assert(target.DocSpriteSlicerV7.libraryStorageStatus.legacyAssets === 1, 'installLibraryStorageAdapter attaches status to runtime shell');
assert(readJson(target.localStorage, STORAGE_KEYS.library, []).length === 1, 'installLibraryStorageAdapter syncs library on install');

const unavailable = createLibraryStorageAdapter({ storage: null });
assert(unavailable.available === false, 'adapter reports unavailable storage');
assert(unavailable.loadCanonicalLibrary().length === 0, 'unavailable adapter returns empty library');

if (process.exitCode) process.exit(process.exitCode);
