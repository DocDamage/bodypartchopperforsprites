import { APP_VERSION, PROJECT_FORMAT_VERSION, CATEGORIES, LPC_ROW_LABELS, safeName, STORAGE_KEYS } from '../src/core/constants.js';
import { DEFAULT_PROFILES, getProfile, resolveProfilePath } from '../src/exporters/profile-defaults.js';
import { buildFrameManifest, buildFramePath, buildAnimationManifest, buildExportPreview, inferAnimation, inferDirection } from '../src/exporters/manifest.js';
import { buildCredits, csvEscape } from '../src/exporters/credits.js';
import { BUILTIN_PLUGINS, DEFAULT_PLUGIN_SETTINGS, normalizePluginSettings } from '../src/plugins/builtin-plugins.js';
import { createDefaultGrid, createDefaultProjectState } from '../src/state/default-state.js';
import { PROJECT_SCHEMA, createProjectSnapshot, migrateProject } from '../src/state/project-format.js';
import { readJson, writeJson, mergeAssets, loadLibrary, saveLibrary, loadPluginSettings, savePluginSettings, saveAutosaveSnapshot, readRecoveryState, clearRecoveryState } from '../src/state/storage.js';
import { createHistoryState, pushHistory, canUndo, canRedo, popUndo, popRedo } from '../src/state/history.js';
import { buildBackupFileName, buildRecoveryPackageFiles } from '../src/state/backup.js';
import { frameCell, frameFromPoint, rectFromPoints, bboxOfPoints, detectGridFromImageSize, makeDefaultRowLabels } from '../src/canvas/frame-utils.js';
import { computeAlphaBoundingBox, boxTouchesEdge, boxCenter, boxBottomCenter, summarizeFrameBoxes } from '../src/canvas/bbox.js';
import { selectPartAtPoint, selectPivotAtPoint, selectObjectAtPoint, selectionLabel } from '../src/canvas/selection.js';
import { clonePartToFrame, mirrorPart, buildHumanoidTemplateParts } from '../src/canvas/parts.js';
import { createDiagnostic, countDiagnostics, checkQaGate, summarizeDiagnostics, maxRange } from '../src/validators/diagnostics.js';
import { validateProjectIntegrity } from '../src/validators/project-integrity.js';
import { buildVisualDiffSummary, validateVisualDiff, buildVisualDiffMarkdown } from '../src/validators/visual-diff.js';
import { validateTimeline } from '../src/validators/timeline.js';
import { buildRuntimeBundle } from '../src/exporters/runtime-bundle.js';

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

const pixels = new Uint8ClampedArray(4 * 4 * 4);
pixels[(1 * 4 + 2) * 4 + 3] = 255;
pixels[(2 * 4 + 3) * 4 + 3] = 255;
const alphaBox = computeAlphaBoundingBox(pixels, 4, 4);
assert(alphaBox.x === 2 && alphaBox.y === 1 && alphaBox.w === 2 && alphaBox.h === 2, 'alpha bbox detects visible pixels');
assert(boxTouchesEdge({ empty: false, x: 0, y: 2, w: 2, h: 2 }, 4, 4), 'edge detector catches left edge');
assert(boxCenter({ empty: false, x: 2, y: 2, w: 4, h: 6 }).x === 4, 'boxCenter computes center x');
assert(boxBottomCenter({ empty: false, x: 2, y: 2, w: 4, h: 6 }).y === 8, 'boxBottomCenter computes bottom y');
assert(summarizeFrameBoxes([{ empty: false, w: 2, h: 3, touchesEdge: true }, { empty: true }]).edgeTouching === 1, 'frame box summary counts edge touching');

const part = { id: 'p1', name: 'head', type: 'rect', row: 0, col: 0, x: 10, y: 10, w: 10, h: 10 };
const pivot = { id: 'v1', name: 'root', x: 32, y: 32 };
assert(selectPartAtPoint([part], { x: 12, y: 12 }).id === 'p1', 'selectPartAtPoint finds part');
assert(selectPivotAtPoint([pivot], { x: 33, y: 33 }).id === 'v1', 'selectPivotAtPoint finds pivot');
assert(selectObjectAtPoint({ grid, parts: [part], pivots: [pivot], point: { x: 12, y: 12 } }).type === 'part', 'selectObjectAtPoint prioritizes part');
assert(selectionLabel({ type: 'part', id: 'p1' }, part) === 'part: head', 'selectionLabel formats selected object');

const cloned = clonePartToFrame(part, grid, 1, 1, () => 'clone');
assert(cloned.id === 'clone' && cloned.row === 1 && cloned.col === 1, 'clonePartToFrame assigns new frame');
const mirrored = mirrorPart(part, grid, () => 'mirror');
assert(mirrored.id === 'mirror' && mirrored.x === 44, 'mirrorPart mirrors rect inside cell');
assert(buildHumanoidTemplateParts({ grid, row: 0, col: 0, idFactory: (prefix) => `${prefix}_template` }).length === 7, 'humanoid template creates starter parts');

assert(DEFAULT_PROFILES.keter.manifest === 'keter_atlas.json', 'keter profile exists');
assert(getProfile(DEFAULT_PROFILES, 'missing').id === 'generic', 'missing profile falls back to generic');
assert(resolveProfilePath(DEFAULT_PROFILES.keter, { base: 'ronin', row: 'idle_down', col: '01' }) === 'keter/frames/idle_down/ronin_idle_down_01.png', 'profile path resolver builds Keter path');
assert(BUILTIN_PLUGINS.some((plugin) => plugin.id === 'exporter.runtime_bundle'), 'runtime bundle plugin exists');
assert(DEFAULT_PLUGIN_SETTINGS['validator.project_integrity'] === true, 'default plugins are enabled');
assert(normalizePluginSettings({ 'validator.visual_diff': false })['validator.visual_diff'] === false, 'plugin settings preserve explicit false');

const state = createDefaultProjectState();
state.grid.baseName = 'The Ronin';
state.grid.rowLabels = ['idle_up', 'idle_left', 'idle_down', 'idle_right'];
state.export.profileId = 'keter';
state.source.dataUrl = 'data:image/png;base64,stub';
assert(state.version === '7.0.0', 'default state reports v7');
assert(state.profiles.generic.id === 'generic', 'default state includes profiles');
assert(state.plugins.enabled['importer.generic_spritesheet'] === true, 'default state includes plugin settings');

const storage = createMemoryStorage();
writeJson(storage, 'example', { ok: true });
assert(readJson(storage, 'example', {}).ok === true, 'storage read/write JSON works');
assert(mergeAssets([{ id: 'a', name: 'old' }], [{ id: 'a', name: 'new' }, { id: 'b' }]).length === 2, 'mergeAssets deduplicates by id');
saveLibrary(storage, [{ id: 'asset_1' }]);
assert(loadLibrary(storage)[0].id === 'asset_1', 'library storage round trips');
savePluginSettings(storage, { 'validator.visual_diff': false });
assert(loadPluginSettings(storage)['validator.visual_diff'] === false, 'plugin settings storage round trips');
const autosaveResult = saveAutosaveSnapshot(storage, createProjectSnapshot(state), STORAGE_KEYS, { slotId: 'slot_test' });
assert(autosaveResult.slotCount === 1, 'autosave creates slot');
assert(readRecoveryState(storage).autosaveSlots[0].id === 'slot_test', 'recovery state exposes autosave slot');
clearRecoveryState(storage);
assert(readRecoveryState(storage).autosaveSlots.length === 0, 'recovery state clears autosave slots');

const history = createHistoryState(3);
pushHistory(history, { step: 1 });
pushHistory(history, { step: 2 });
assert(canUndo(history), 'history can undo');
assert(popUndo(history, { step: 3 }).step === 2, 'history pops undo snapshot');
assert(canRedo(history), 'history can redo after undo');
assert(popRedo(history, { step: 2 }).step === 3, 'history pops redo snapshot');
assert(buildBackupFileName(state, '2026-05-18T19:00:00.000Z').includes('the_ronin_backup'), 'backup filename uses project base name');
assert(buildRecoveryPackageFiles({ currentProject: {}, recoveryState: {}, pluginManifest: {} }).length === 6, 'recovery package file manifest has expected files');

const framePath = buildFramePath({ grid: state.grid, profiles: state.profiles, exportSettings: state.export, row: 2, col: 0 });
assert(framePath === 'keter/frames/idle_down/the_ronin_idle_down_01.png', 'buildFramePath uses active profile');
assert(buildFrameManifest({ grid: state.grid, profiles: state.profiles, exportSettings: state.export }).length === state.grid.rows * state.grid.cols, 'frame manifest covers all cells');
assert(buildAnimationManifest({ grid: state.grid, anim: state.anim, timeline: state.timeline }).clips.length === state.grid.rowLabels.length, 'animation manifest falls back to row clips');
assert(buildExportPreview({ state }).files.some((file) => file.type === 'manifest'), 'export preview includes manifest file');
assert(inferDirection('slash_left') === 'left', 'direction inference uses suffix');
assert(inferAnimation('slash_left') === 'slash', 'animation inference uses prefix');

const credits = buildCredits({ library: [{ id: 'a1', name: 'Ronin Hair', creator: 'DocDamage', license: 'private' }], recipe: { layers: [{ assetId: 'a1' }] } });
assert(credits.md.includes('Ronin Hair'), 'credits markdown includes asset name');
assert(csvEscape('a"b') === '"a""b"', 'csvEscape doubles quotes');

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

assert(validateProjectIntegrity(state).some((diag) => diag.severity === 'pass'), 'project integrity passes valid default state');
const brokenState = { ...state, recipe: { layers: [{ assetId: 'missing' }] }, library: [] };
assert(validateProjectIntegrity(brokenState).some((diag) => diag.title === 'Broken recipe layers'), 'project integrity catches broken recipe layers');

const visualSummary = buildVisualDiffSummary({
  grid: { ...state.grid, cols: 2, rows: 1, rowLabels: ['idle_down'] },
  frameBoxes: [
    { row: 0, col: 0, empty: false, x: 10, y: 10, w: 20, h: 30 },
    { row: 0, col: 1, empty: false, x: 20, y: 10, w: 20, h: 50 }
  ]
});
assert(visualSummary[0].centerDrift === 10, 'visual diff computes center drift');
assert(validateVisualDiff(visualSummary).some((diag) => diag.title.includes('Center drift')), 'visual diff validator warns on center drift');
assert(buildVisualDiffMarkdown(visualSummary).includes('Visual QA Diff Report'), 'visual diff report builds markdown');

const timelineDiagnostics = validateTimeline({
  grid: state.grid,
  timeline: { clips: [{ name: 'idle_down', row: 2, frames: [0, 1, 2], durations: [125, 125, 125] }] }
});
assert(timelineDiagnostics.some((diag) => diag.severity === 'pass'), 'timeline validator passes valid clip');
assert(validateTimeline({ grid: state.grid, timeline: { clips: [{ name: 'bad', row: 99, frames: [99], durations: [0] }] } }).some((diag) => diag.severity === 'fail'), 'timeline validator fails invalid clip');

const runtime = buildRuntimeBundle({ ...state, qa: { diagnostics }, visualDiff: [{ row: 0 }] }, { frames: [{ row: 0, col: 0 }] });
assert(runtime.version === '7.0.0', 'runtime bundle uses v7 version');
assert(runtime.qa.summary.total === 3, 'runtime bundle includes QA summary');
assert(runtime.frames.length === 1, 'runtime bundle includes supplied frames');

if (process.exitCode) process.exit(process.exitCode);
