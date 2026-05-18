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

assert(index.includes('Doc Sprite Slicer Studio v6'), 'index declares v6 title/brand');
assert(index.includes('id="mainCanvas"'), 'index contains main canvas');
assert(index.includes('data-mode="timeline"'), 'index exposes Timeline Lab mode');
assert(index.includes('data-mode="pose"'), 'index exposes Pose Lab mode');
assert(index.includes('data-mode="remap"'), 'index exposes Sheet Remapper mode');
assert(index.includes('data-mode="atlas"'), 'index exposes Atlas Lab mode');
assert(index.includes('data-mode="plugins"'), 'index exposes Plugin Manager mode');
assert(styles.includes('.menu-bar'), 'styles include menu bar layout');
assert(styles.includes('.workbench'), 'styles include workbench layout');
assert(styles.includes('.mode-rail'), 'styles include left workflow rail');
assert(app.includes("const VERSION = '6.0.0'"), 'app version is 6.0.0');
assert(app.includes('PROJECT_SCHEMA_V6'), 'app includes v6 schema marker');
assert(app.includes('BUILTIN_PLUGINS'), 'app includes plugin registry');
assert(app.includes('buildTimelineClipFromRow'), 'app includes timeline clip action');
assert(app.includes('packAtlas'), 'app includes atlas action');
assert(app.includes('exportRuntimeBundle'), 'app includes runtime bundle export action');

try {
  new vm.Script(app, { filename: 'app.js' });
  console.log('PASS: app.js parses as JavaScript');
} catch (error) {
  console.error('FAIL: app.js parses as JavaScript');
  console.error(error.message);
  process.exitCode = 1;
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
