import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const index = read('index.html');
const styles = read('styles.css');
const app = read('app.js');
const runtimeShell = read('src/browser/runtime-shell.js');

assert(index.includes('Doc Sprite Slicer Studio v6'), 'index declares v6 title/brand');
assert(index.includes('id="mainCanvas"'), 'index contains main canvas');
assert(index.includes('src/browser/runtime-shell.js'), 'index loads V7 runtime shell module');
assert(index.includes('data-mode="timeline"'), 'index exposes Timeline Lab mode');
assert(index.includes('type="module" src="app.js"'), 'index loads app.js as an ES module');
assert(index.includes('data-mode="pose"'), 'index exposes Pose Lab mode');
assert(index.includes('data-mode="remap"'), 'index exposes Sheet Remapper mode');
assert(index.includes('data-mode="atlas"'), 'index exposes Atlas Lab mode');
assert(index.includes('data-mode="plugins"'), 'index exposes Plugin Manager mode');
assert(styles.includes('.menu-bar'), 'styles include menu bar layout');
assert(styles.includes('.workbench'), 'styles include workbench layout');
assert(styles.includes('.mode-rail'), 'styles include left workflow rail');
assert(app.includes("from './src/core/constants.js'"), 'app imports V7 core constants');
assert(app.includes('const VERSION = APP_VERSION'), 'app version uses core APP_VERSION');
assert(app.includes('createV7ProjectSnapshot'), 'app uses V7 project snapshot helper');
assert(app.includes('migrateV7Project'), 'app uses V7 project migration helper');
assert(app.includes('BUILTIN_PLUGINS'), 'app includes plugin registry');
assert(app.includes('buildTimelineClipFromRow'), 'app includes timeline clip action');
assert(app.includes('packAtlas'), 'app includes atlas action');
assert(app.includes('exportRuntimeBundle'), 'app includes runtime bundle export action');
assert(runtimeShell.includes('bootRuntimeShell'), 'runtime shell exposes boot helper');
assert(runtimeShell.includes('DocSpriteSlicerV7'), 'runtime shell exposes global bridge marker');

try {
  const appScriptBody = app.replace(/^(?:import[\s\S]*?;\r?\n\s*)+/, '');
  new vm.Script(appScriptBody, { filename: 'app.js' });
  console.log('PASS: app.js parses as JavaScript');
} catch (error) {
  console.error('FAIL: app.js parses as JavaScript');
  console.error(error.message);
  process.exitCode = 1;
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
