import { APP_VERSION, PROJECT_FORMAT_VERSION, CATEGORIES, LPC_ROW_LABELS, safeName } from '../src/core/constants.js';
import { DEFAULT_PROFILES, getProfile } from '../src/exporters/profile-defaults.js';
import { BUILTIN_PLUGINS, DEFAULT_PLUGIN_SETTINGS, normalizePluginSettings } from '../src/plugins/builtin-plugins.js';
import { createDefaultGrid, createDefaultProjectState } from '../src/state/default-state.js';
import { PROJECT_SCHEMA, createProjectSnapshot, migrateProject } from '../src/state/project-format.js';
import { frameCell, frameFromPoint, rectFromPoints, bboxOfPoints, detectGridFromImageSize, makeDefaultRowLabels } from '../src/canvas/frame-utils.js';
import { createDiagnostic, countDiagnostics, checkQaGate, summarizeDiagnostics, maxRange } from '../src/validators/diagnostics.js';
import { buildRuntimeBundle } from '../src/exporters/runtime-bundle.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

assert(APP_VERSION === '7.0.0', 'core version is v7');
assert(PROJECT_FORMAT_VERSION === 7, 'project format version is 7');
assert(CATEGORIES.includes('weapons'), 'categories include weapons');
assert(LPC_ROW_LABELS.includes('idle_down'), 'LPC rows include idle_down');
assert(safeName('The Ronin / Idle') === 'the_ronin_idle', 'safeName normalizes labels');

const grid = createDefaultGrid();
assert(grid.frameW === 64 && grid.frameH === 64, 'default grid is 64x64');
assert(frameCell(grid, 2, 3).x === 192, 'frameCell computes x position');
assert(frameFromPoint(grid, { x: 200, y: 130 }).row === 2, 'frameFromPoint computes row');
assert(rectFromPoints({ x: 10, y: 20 }, { x: 2, y: 40 }).w === 8, 'rectFromPoints normalizes width');
assert(bboxOfPoints([{ x: 2, y: 3 }, { x: 12, y: 8 }]).w === 10, 'bboxOfPoints computes width');
assert(detectGridFromImageSize(832, 256).frameW === 64, 'grid detector prefers 64px LPC grid');
assert(makeDefaultRowLabels(5).length === 5, 'default row label generator creates requested rows');

assert(DEFAULT_PROFILES.keter.manifest === 'keter_atlas.json', 'keter profile exists');
assert(getProfile(DEFAULT_PROFILES, 'missing').id === 'generic', 'missing profile falls back to generic');
assert(BUILTIN_PLUGINS.some((plugin) => plugin.id === 'exporter.runtime_bundle'), 'runtime bundle plugin exists');
assert(DEFAULT_PLUGIN_SETTINGS['validator.project_integrity'] === true, 'default plugins are enabled');
assert(normalizePluginSettings({ 'validator.visual_diff': false })['validator.visual_diff'] === false, 'plugin settings preserve explicit false');

const state = createDefaultProjectState();
assert(state.version === '7.0.0', 'default state reports v7');
assert(state.profiles.generic.id === 'generic', 'default state includes profiles');
assert(state.plugins.enabled['importer.generic_spritesheet'] === true, 'default state includes plugin settings');

const snapshot = createProjectSnapshot(state, { includeLibrary: true });
assert(snapshot.projectFormatVersion === 7, 'project snapshot uses v7 format');
assert(snapshot.schema.required.includes('timeline'), 'project schema requires timeline');
assert(PROJECT_SCHEMA.projectFormatVersion === 7, 'exported schema is v7');

const migrated = migrateProject({ version: '4.0.0', grid: { cols: 8 }, recipe: { id: 'old_recipe' } });
assert(migrated.projectFormatVersion === 7, 'migrates old projects to v7');
assert(migrated.grid.cols === 8, 'migration preserves known grid fields');
assert(migrated.recipe.id === 'old_recipe', 'migration preserves recipe id');
assert(Array.isArray(migrated.migrationReport), 'migration creates report array');

const diagnostics = [
  createDiagnostic('pass', 'ok', 'ok'),
  createDiagnostic('warning', 'warn', 'warn'),
  createDiagnostic('fail', 'fail', 'fail')
];
assert(countDiagnostics(diagnostics).fail === 1, 'diagnostic counter counts failures');
assert(checkQaGate({ blockFailures: true, allowWarnings: true, diagnostics }).ok === false, 'QA gate blocks failures');
assert(summarizeDiagnostics(diagnostics).total === 3, 'diagnostic summary counts total');
assert(maxRange([2, 5, 9]) === 7, 'maxRange computes spread');

const runtime = buildRuntimeBundle({ ...state, qa: { diagnostics }, visualDiff: [{ row: 0 }] }, { frames: [{ row: 0, col: 0 }] });
assert(runtime.version === '7.0.0', 'runtime bundle uses v7 version');
assert(runtime.qa.summary.total === 3, 'runtime bundle includes QA summary');
assert(runtime.frames.length === 1, 'runtime bundle includes supplied frames');

if (process.exitCode) process.exit(process.exitCode);
