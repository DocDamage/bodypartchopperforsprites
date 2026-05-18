import { APP_VERSION } from '../src/core/constants.js';
import { createDefaultProjectState } from '../src/state/default-state.js';
import { buildTimelineClipFromRow, buildTimelineManifest, applyClipToAnimation, toggleOnionSkin, normalizeClipName } from '../src/labs/timeline-lab.js';
import { ensurePartTransform, rotateTransform, resetTransform, buildPoseSnapshot, normalizePoseName } from '../src/labs/pose-lab.js';
import { remapPath, buildRemapPlan } from '../src/labs/remap-lab.js';
import { buildAtlasManifest, summarizeAtlas } from '../src/labs/atlas-lab.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const state = createDefaultProjectState();
state.grid.baseName = 'The Ronin';
state.grid.rowLabels = ['idle_up', 'idle_left', 'idle_down', 'idle_right'];
state.export.profileId = 'keter';

const clip = buildTimelineClipFromRow({ grid: state.grid, row: 2, fps: 8, idFactory: () => 'clip_1' });
assert(clip.id === 'clip_1', 'timeline clip uses id factory');
assert(clip.name === 'idle_down', 'timeline clip uses row label');
assert(clip.frames.length === state.grid.cols, 'timeline clip covers row columns');
assert(buildTimelineManifest({ version: APP_VERSION, timeline: { clips: [clip] }, grid: state.grid }).clips.length === 1, 'timeline manifest includes clips');
assert(applyClipToAnimation({}, clip).previewRow === 2, 'applyClipToAnimation sets preview row');
assert(toggleOnionSkin({ enabled: false }).enabled === true, 'toggleOnionSkin flips state');
assert(normalizeClipName('Idle Down!') === 'idle_down', 'normalizeClipName cleans names');

const part = { id: 'p1', name: 'head', row: 0, col: 0 };
const transform = ensurePartTransform({}, part);
assert(transform.partId === 'p1', 'ensurePartTransform creates default transform');
assert(rotateTransform(transform, 15).rotation === 15, 'rotateTransform adds degrees');
assert(resetTransform({ ...transform, rotation: 30 }).rotation === 0, 'resetTransform clears rotation');
assert(buildPoseSnapshot({ part, transform, name: 'Head Test', idFactory: () => 'pose_1' }).name === 'head_test', 'pose snapshot normalizes name');
assert(normalizePoseName('Pose One!') === 'pose_one', 'normalizePoseName cleans names');

assert(remapPath('godot_folders', { label: 'idle_down', row: 2, col: 0 }, 'ronin') === 'godot/idle_down/idle_down_01.png', 'remapPath builds Godot path');
assert(buildRemapPlan({ state, target: 'keter_runtime' }).length === state.grid.rows * state.grid.cols, 'remap plan covers all frames');

const atlas = buildAtlasManifest({ state, padding: 2, maxWidth: 256, name: 'ronin_atlas' });
assert(atlas.name === 'ronin_atlas', 'atlas manifest uses provided name');
assert(atlas.frames.length === state.grid.rows * state.grid.cols, 'atlas manifest includes all frames');
assert(summarizeAtlas(atlas).frameCount === atlas.frames.length, 'atlas summary counts frames');

if (process.exitCode) process.exit(process.exitCode);
