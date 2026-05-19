import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const LIBRARY_IMPORT = "import { createLibraryStorageAdapter } from './src/browser/library-storage-adapter.js';";
const ADAPTER_CONST = "  const libraryStorageAdapter = createLibraryStorageAdapter({ target: window });";

const LEGACY_LIBRARY_BLOCK = `  function loadLibraryFromStorage() {
    try {
      state.library = JSON.parse(localStorage.getItem(LIBRARY_KEY) || localStorage.getItem(V6_LIBRARY_KEY) || '[]');
      const rawPlugins = localStorage.getItem(PLUGIN_SETTINGS_KEY);
      if (rawPlugins) state.plugins.enabled = { ...DEFAULT_PLUGIN_SETTINGS, ...JSON.parse(rawPlugins) };
    } catch { state.library = []; }
  }
  function saveLibraryToStorage() {
    try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(state.library)); } catch (err) { toast('Library is too large for browser local storage. Export it as JSON.', 'warn'); }
  }`;

const ADAPTER_LIBRARY_BLOCK = `  function loadLibraryFromStorage() {
    try {
      state.library = libraryStorageAdapter.loadCanonicalLibrary();
      const rawPlugins = localStorage.getItem(PLUGIN_SETTINGS_KEY);
      if (rawPlugins) state.plugins.enabled = { ...DEFAULT_PLUGIN_SETTINGS, ...JSON.parse(rawPlugins) };
      if (window.DocSpriteSlicerV7) window.DocSpriteSlicerV7.libraryStorageStatus = libraryStorageAdapter.status();
    } catch {
      state.library = [];
    }
  }
  function saveLibraryToStorage() {
    try {
      libraryStorageAdapter.saveCanonicalLibrary(state.library);
      if (window.DocSpriteSlicerV7) window.DocSpriteSlicerV7.libraryStorageStatus = libraryStorageAdapter.status();
    } catch (err) {
      toast('Library is too large for browser local storage. Export it as JSON.', 'warn');
    }
  }`;

export function integrateAppLibraryAdapter(source) {
  let output = source;
  let changed = false;

  if (!output.includes(LIBRARY_IMPORT)) {
    const coreImportPattern = /import \{[\s\S]*?\} from '\.\/src\/core\/constants\.js';/;
    if (!coreImportPattern.test(output)) throw new Error('Could not find V7 core constants import in app.js.');
    output = output.replace(coreImportPattern, (match) => `${match}\n${LIBRARY_IMPORT}`);
    changed = true;
  }

  if (!output.includes(ADAPTER_CONST)) {
    const anchor = '  const LPC_ROW_LABELS = CORE_LPC_ROW_LABELS;';
    if (!output.includes(anchor)) throw new Error('Could not find LPC_ROW_LABELS anchor in app.js.');
    output = output.replace(anchor, `${anchor}\n  ${''}\n${ADAPTER_CONST}`.replace('  \n', '\n'));
    changed = true;
  }

  if (output.includes(LEGACY_LIBRARY_BLOCK)) {
    output = output.replace(LEGACY_LIBRARY_BLOCK, ADAPTER_LIBRARY_BLOCK);
    changed = true;
  } else if (!output.includes('libraryStorageAdapter.loadCanonicalLibrary()') || !output.includes('libraryStorageAdapter.saveCanonicalLibrary(state.library)')) {
    throw new Error('Could not find legacy library storage block or existing adapter integration in app.js.');
  }

  return { output, changed };
}

export function integrateStaticSmokeTest(source) {
  const oldLine = "  const appScriptBody = app.replace(/^import[\\s\\S]*?;\\n\\n/, '');";
  const newLine = "  const appScriptBody = app.replace(/^(?:import[\\s\\S]*?;\\n\\s*)+/, '');";
  if (source.includes(newLine)) return { output: source, changed: false };
  if (!source.includes(oldLine)) throw new Error('Could not find app import stripping line in static smoke test.');
  return { output: source.replace(oldLine, newLine), changed: true };
}

function applyFile(relativePath, transformer, write) {
  const filePath = path.join(root, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const result = transformer(source);
  if (write && result.changed) fs.writeFileSync(filePath, result.output);
  return { relativePath, ...result };
}

export function runIntegration({ write = false } = {}) {
  const results = [
    applyFile('app.js', integrateAppLibraryAdapter, write),
    applyFile('tests/static-smoke-test.mjs', integrateStaticSmokeTest, write)
  ];
  return {
    changed: results.some((result) => result.changed),
    results
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  const result = runIntegration({ write });
  for (const item of result.results) {
    console.log(`${item.changed ? 'CHANGED' : 'OK'} ${item.relativePath}`);
  }
  if (!write && result.changed) {
    console.log('\nDry run only. Re-run with --write to update files.');
  }
}
