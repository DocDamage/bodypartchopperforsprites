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

const shell = createRuntimeShell({ legacyRuntime: true });
assert(shell.version === APP_VERSION, 'runtime shell uses app version');
assert(shell.projectFormatVersion === PROJECT_FORMAT_VERSION, 'runtime shell uses project format version');
assert(shell.legacyRuntime === true, 'runtime shell records legacy bridge mode');
assert(shell.plugins.some((plugin) => plugin.id === 'exporter.runtime_bundle'), 'runtime shell exposes plugin registry');
assert(shell.state.version === APP_VERSION, 'runtime shell creates default v7 state');

const target = {};
attachRuntimeShell(target, shell);
assert(target.DocSpriteSlicerV7 === shell, 'attachRuntimeShell exposes global shell');

const fakeDocument = createFakeDocument();
assert(patchLegacyBrand(fakeDocument, APP_VERSION) === true, 'patchLegacyBrand returns true with fake document');
assert(fakeDocument.title === 'Doc Sprite Slicer Studio v7', 'patchLegacyBrand updates title');
assert(fakeDocument.nodes['.brand-block strong'].innerHTML.includes('v7'), 'patchLegacyBrand updates strong brand');
assert(fakeDocument.nodes['.brand-block em'].textContent.includes('V7'), 'patchLegacyBrand updates subtitle');

const bootTarget = { document: createFakeDocument() };
const booted = bootRuntimeShell({ target: bootTarget, documentRef: bootTarget.document, legacyRuntime: true });
assert(bootTarget.DocSpriteSlicerV7 === booted, 'bootRuntimeShell attaches shell');
assert(bootTarget.document.title === 'Doc Sprite Slicer Studio v7', 'bootRuntimeShell patches document');

if (process.exitCode) process.exit(process.exitCode);
