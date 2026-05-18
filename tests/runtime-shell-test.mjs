import { APP_VERSION, PROJECT_FORMAT_VERSION } from '../src/core/constants.js';
import { createRuntimeShell, attachRuntimeShell, patchLegacyBrand, bootRuntimeShell } from '../src/browser/runtime-shell.js';

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
  return {
    title: '',
    nodes,
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

const memoryStorage = createMemoryStorage();
const storageTarget = { localStorage: memoryStorage };
const storageShell = createRuntimeShell({ target: storageTarget, legacyRuntime: true });
storageShell.storageBridge.saveLibrary([{ id: 'asset_1', name: 'Ronin Hair' }]);
storageShell.storageStatus = storageShell.storageBridge ? storageShell.storageStatus : storageShell.storageStatus;
assert(storageShell.storageBridge.available === true, 'runtime shell creates storage bridge from target localStorage');
assert(storageShell.storageBridge.loadLibrary()[0].id === 'asset_1', 'runtime shell storage bridge can access library storage');
assert(storageShell.storageStatus.available === true, 'runtime shell exposes available storage status from target storage');

const target = {};
attachRuntimeShell(target, shell);
assert(target.DocSpriteSlicerV7 === shell, 'attachRuntimeShell exposes global shell');

const fakeDocument = createFakeDocument();
assert(patchLegacyBrand(fakeDocument, APP_VERSION) === true, 'patchLegacyBrand returns true with fake document');
assert(fakeDocument.title === 'Doc Sprite Slicer Studio v7', 'patchLegacyBrand updates title');
assert(fakeDocument.nodes['.brand-block strong'].innerHTML.includes('v7'), 'patchLegacyBrand updates strong brand');
assert(fakeDocument.nodes['.brand-block em'].textContent.includes('V7'), 'patchLegacyBrand updates subtitle');

const bootTarget = { document: createFakeDocument(), localStorage: createMemoryStorage() };
const booted = bootRuntimeShell({ target: bootTarget, documentRef: bootTarget.document, legacyRuntime: true });
assert(bootTarget.DocSpriteSlicerV7 === booted, 'bootRuntimeShell attaches shell');
assert(bootTarget.DocSpriteSlicerV7.storageBridge.available === true, 'bootRuntimeShell attaches shell with storage bridge');
assert(bootTarget.document.title === 'Doc Sprite Slicer Studio v7', 'bootRuntimeShell patches document');

if (process.exitCode) process.exit(process.exitCode);
