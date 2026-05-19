import { APP_VERSION, PROJECT_FORMAT_VERSION, STORAGE_KEYS } from '../src/core/constants.js';
import { createRuntimeShell, attachRuntimeShell, patchLegacyBrand, bootRuntimeShell, syncShellLibraryStorage, installHiddenAttributeGuard } from '../src/browser/runtime-shell.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

function createFakeDocument() {
  const nodes = {
    '.brand-block strong': { innerHTML: '' },
    '.brand-block em': { textContent: '' }
  };
  const appended = [];
  return {
    title: '',
    nodes,
    appended,
    head: { appendChild: (node) => appended.push(node) },
    createElement(tag) {
      return { tagName: tag.toUpperCase(), id: '', textContent: '' };
    },
    getElementById(id) {
      return appended.find((node) => node.id === id) || null;
    },
    querySelector(selector) {
      return nodes[selector] || null;
    }
  };
}

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key)
  };
}

const shell = createRuntimeShell({ legacyRuntime: true });
assert(shell.version === APP_VERSION, 'runtime shell uses app version');
assert(shell.projectFormatVersion === PROJECT_FORMAT_VERSION, 'runtime shell uses project format version');
assert(shell.legacyRuntime === true, 'runtime shell records legacy bridge mode');
assert(shell.plugins.some((plugin) => plugin.id === 'exporter.runtime_bundle'), 'runtime shell exposes plugin registry');
assert(shell.state.version === APP_VERSION, 'runtime shell creates default v7 state');
assert(shell.storageBridge.available === false, 'runtime shell creates unavailable storage bridge without browser storage');
assert(shell.storageStatus.available === false, 'runtime shell exposes unavailable storage status without browser storage');
assert(shell.libraryStorageAdapter.available === false, 'runtime shell creates unavailable library adapter without browser storage');
assert(shell.libraryStorageStatus.available === false, 'runtime shell exposes unavailable library status without browser storage');

const guardDocument = createFakeDocument();
assert(installHiddenAttributeGuard(guardDocument) === true, 'installHiddenAttributeGuard injects hidden rule');
assert(guardDocument.appended[0].id === 'v7-hidden-attribute-guard', 'installHiddenAttributeGuard adds stable style id');
assert(guardDocument.appended[0].textContent.includes('[hidden]'), 'installHiddenAttributeGuard writes hidden selector');
assert(guardDocument.appended[0].textContent.includes('!important'), 'installHiddenAttributeGuard hidden rule uses important display override');
assert(installHiddenAttributeGuard(guardDocument) === false, 'installHiddenAttributeGuard is idempotent');

const memoryStorage = createMemoryStorage();
const storageTarget = { localStorage: memoryStorage };
const storageShell = createRuntimeShell({ target: storageTarget, legacyRuntime: true });
storageShell.storageBridge.saveLibrary([{ id: 'asset_1', name: 'Ronin Hair' }]);
assert(storageShell.storageBridge.available === true, 'runtime shell creates storage bridge from target localStorage');
assert(storageShell.storageBridge.loadLibrary()[0].id === 'asset_1', 'runtime shell storage bridge can access library storage');
assert(storageShell.storageStatus.available === true, 'runtime shell exposes available storage status from target storage');
assert(storageShell.libraryStorageAdapter.available === true, 'runtime shell creates library adapter from target localStorage');
assert(storageShell.libraryStorageStatus.available === true, 'runtime shell exposes available library status from target storage');

storageTarget.localStorage.setItem(STORAGE_KEYS.legacyLibraryV6, JSON.stringify([{ id: 'legacy_asset', name: 'Legacy Hair' }]));
const syncedStatus = syncShellLibraryStorage(storageShell);
const syncedLibrary = JSON.parse(storageTarget.localStorage.getItem(STORAGE_KEYS.library));
assert(syncedStatus.legacyAssets === 2, 'syncShellLibraryStorage reports mirrored legacy assets after sync');
assert(syncedLibrary.some((asset) => asset.id === 'asset_1'), 'syncShellLibraryStorage preserves existing canonical library data');
assert(syncedLibrary.some((asset) => asset.id === 'legacy_asset'), 'syncShellLibraryStorage writes legacy library data into canonical storage');

const target = {};
attachRuntimeShell(target, shell);
assert(target.DocSpriteSlicerV7 === shell, 'attachRuntimeShell exposes global shell');

const fakeDocument = createFakeDocument();
assert(patchLegacyBrand(fakeDocument, APP_VERSION) === true, 'patchLegacyBrand returns true with fake document');
assert(fakeDocument.title === 'Doc Sprite Slicer Studio v7', 'patchLegacyBrand updates title');
assert(fakeDocument.nodes['.brand-block strong'].innerHTML.includes('v7'), 'patchLegacyBrand updates strong brand');
assert(fakeDocument.nodes['.brand-block em'].textContent.includes('V7'), 'patchLegacyBrand updates subtitle');

const bootTarget = { document: createFakeDocument(), localStorage: createMemoryStorage() };
bootTarget.localStorage.setItem(STORAGE_KEYS.legacyLibraryV6, JSON.stringify([{ id: 'boot_asset', name: 'Boot Hair' }]));
const booted = bootRuntimeShell({ target: bootTarget, documentRef: bootTarget.document, legacyRuntime: true });
assert(bootTarget.DocSpriteSlicerV7 === booted, 'bootRuntimeShell attaches shell');
assert(bootTarget.DocSpriteSlicerV7.storageBridge.available === true, 'bootRuntimeShell attaches shell with storage bridge');
assert(bootTarget.DocSpriteSlicerV7.libraryStorageAdapter.available === true, 'bootRuntimeShell attaches shell with library adapter');
assert(bootTarget.DocSpriteSlicerV7.libraryStorageStatus.legacyAssets === 1, 'bootRuntimeShell syncs legacy library into library status');
assert(JSON.parse(bootTarget.localStorage.getItem(STORAGE_KEYS.library))[0].id === 'boot_asset', 'bootRuntimeShell syncs legacy library into canonical key');
assert(bootTarget.document.getElementById('v7-hidden-attribute-guard'), 'bootRuntimeShell installs hidden attribute guard');
assert(bootTarget.document.title === 'Doc Sprite Slicer Studio v7', 'bootRuntimeShell patches document');

if (process.exitCode) process.exit(process.exitCode);