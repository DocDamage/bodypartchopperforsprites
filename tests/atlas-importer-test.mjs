import { loadSourceImage } from '../src/importers/atlas/loader.js';
import { analyzeSource } from '../src/importers/atlas/analyzer.js';
import { buildForegroundMask, detectBackgroundModel } from '../src/importers/atlas/background.js';
import { findConnectedComponents } from '../src/importers/atlas/components.js';
import { mergeNearbyComponents } from '../src/importers/atlas/merge.js';
import { classifyObjects } from '../src/importers/atlas/classify.js';
import { groupByRows, assignDefaultAnimations } from '../src/importers/atlas/group.js';
import { getPreset, presetIds } from '../src/importers/atlas/presets.js';
import { createAtlasSession, createAtlasObject, createEntity, createAnimation, migrateAtlasSession } from '../src/importers/atlas/session.js';
import { runAtlasPipeline } from '../src/importers/atlas/pipeline.js';
import { buildExportMetadata, buildAtlasJson } from '../src/exporters/atlas/metadata.js';

function makeImageData(width, height, fillFn) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = fillFn(x, y);
      const idx = (y * width + x) * 4;
      data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = a;
    }
  }
  return { width, height, data };
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg}: expected ${expected}, got ${actual}`);
}

function assertTrue(val, msg) {
  if (!val) throw new Error(`${msg}: expected true, got ${val}`);
}

function assertAtLeast(actual, min, msg) {
  if (actual < min) throw new Error(`${msg}: expected at least ${min}, got ${actual}`);
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('presets loaded', () => {
  const ids = presetIds();
  assertAtLeast(ids.length, 8, 'preset count');
  const p = getPreset('freeform_fighting');
  assertEqual(p.id, 'freeform_fighting', 'preset id');
});

test('session creation and migration', () => {
  const s = createAtlasSession({ file_name: 'test.png', width: 64, height: 64 }, 'jrpg_tiny');
  assertEqual(s.schema_version, '1.0.0', 'schema version');
  assertEqual(s.preset, 'jrpg_tiny', 'preset');
  const migrated = migrateAtlasSession(s);
  assertEqual(migrated.schema_version, '1.0.0', 'migrated version');
});

test('analyzer detects dominant colors', () => {
  const img = makeImageData(32, 32, (x, y) => {
    if (x < 2 || x > 29 || y < 2 || y > 29) return [34, 177, 76, 255];
    return [200, 50, 50, 255];
  });
  const analysis = analyzeSource(img);
  assertEqual(analysis.width, 32, 'width');
  assertEqual(analysis.height, 32, 'height');
  assertAtLeast(analysis.background_candidates.length, 1, 'background candidates');
});

test('background model detection', () => {
  const analysis = {
    background_candidates: [{ type: 'edge_color', color: [34, 177, 76], confidence: 0.8 }],
    dominant_colors: { edge: [34, 177, 76], full: [34, 177, 76], top_left: [34, 177, 76] }
  };
  const preset = getPreset('freeform_fighting');
  const model = detectBackgroundModel(analysis, preset);
  assertEqual(model.mode, 'solid_chroma_edge_color', 'background mode');
});

test('foreground mask with edge flood fill', () => {
  const img = makeImageData(32, 32, (x, y) => {
    if (x < 2 || x > 29 || y < 2 || y > 29) return [34, 177, 76, 255];
    return [200, 50, 50, 255];
  });
  const mask = buildForegroundMask(img, { mode: 'solid_chroma_edge_color', color: [34, 177, 76], tolerance: 8, edgeFloodFill: true });
  let fg = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) fg++;
  assertAtLeast(fg, 100, 'foreground pixels after flood fill');
});

test('connected components detection', () => {
  const img = makeImageData(64, 64, (x, y) => {
    if (x >= 10 && x < 20 && y >= 10 && y < 20) return [200, 50, 50, 255];
    if (x >= 40 && x < 55 && y >= 40 && y < 55) return [50, 200, 50, 255];
    return [0, 0, 0, 255];
  });
  const mask = buildForegroundMask(img, { mode: 'solid_chroma_dominant_color', color: [0, 0, 0], tolerance: 8, edgeFloodFill: false });
  const comps = findConnectedComponents(mask, 64, 64, { minArea: 10 });
  assertAtLeast(comps.length, 2, 'component count');
});

test('merge nearby components', () => {
  const comps = [
    { source_bbox: [10, 10, 10, 10], class: 'character_frame', area: 100, centroid: [15, 15] },
    { source_bbox: [21, 10, 10, 10], class: 'character_frame', area: 100, centroid: [26, 15] },
    { source_bbox: [50, 50, 10, 10], class: 'character_frame', area: 100, centroid: [55, 55] }
  ];
  const merged = mergeNearbyComponents(comps, { characterMergeDistance: 12 });
  assertAtLeast(merged.length, 2, 'merged count should be <= 3');
});

test('classification assigns classes', () => {
  const comps = [
    { source_bbox: [10, 40, 30, 40], area: 1200, aspect_ratio: 0.75, centroid: [25, 60] },
    { source_bbox: [60, 60, 8, 2], area: 16, aspect_ratio: 4, centroid: [64, 61] }
  ];
  const analysis = { sheet_type_guess: 'freeform_fighting', estimated_average_scale: 32, width: 100, height: 100 };
  const preset = getPreset('freeform_fighting');
  const classified = classifyObjects(comps, analysis, preset);
  assertAtLeast(classified.filter(c => c.class === 'character_frame').length, 1, 'character frames');
});

test('row grouping', () => {
  const objs = [
    createAtlasObject({ source_bbox: [0, 0, 10, 10], centroid: [5, 5] }),
    createAtlasObject({ source_bbox: [20, 0, 10, 10], centroid: [25, 5] }),
    createAtlasObject({ source_bbox: [0, 30, 10, 10], centroid: [5, 35] }),
    createAtlasObject({ source_bbox: [20, 30, 10, 10], centroid: [25, 35] })
  ];
  const rows = groupByRows(objs, { rowClusterTolerance: 10 });
  assertEqual(rows.length, 2, 'row count');
});

test('default animation assignment', () => {
  const rows = [
    [createAtlasObject({ id: 'a1' }), createAtlasObject({ id: 'a2' })],
    [createAtlasObject({ id: 'b1' })]
  ];
  const anims = assignDefaultAnimations(rows, 'entity_1');
  assertAtLeast(anims.length, 2, 'animation count');
  assertEqual(anims[0].entity_id, 'entity_1', 'entity id');
});

test('metadata builder', () => {
  const session = createAtlasSession({ file_name: 'test.png', width: 64, height: 64 }, 'manual_hybrid');
  session.objects = [createAtlasObject({ id: 'o1', class: 'character_frame' })];
  session.entities = [createEntity({ id: 'e1', name: 'Hero' })];
  session.animations = [createAnimation({ id: 'a1', entity_id: 'e1', name: 'idle' })];
  const meta = buildExportMetadata(session);
  assertEqual(meta.objects.length, 1, 'meta objects');
  assertEqual(meta.entities.length, 1, 'meta entities');
});

test('atlas json builder', () => {
  const session = createAtlasSession({ file_name: 'test.png', width: 64, height: 64 }, 'manual_hybrid');
  session.objects = [
    createAtlasObject({ id: 'o1', trimmed_bbox: [0, 0, 10, 10] }),
    createAtlasObject({ id: 'o2', trimmed_bbox: [20, 20, 10, 10] })
  ];
  const atlas = buildAtlasJson(session);
  assertAtLeast(atlas.frames.length, 2, 'atlas frames');
  assertAtLeast(atlas.width, 1, 'atlas width');
});

async function run() {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  PASS: ${t.name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL: ${t.name} — ${err.message}`);
      failed++;
    }
  }
  console.log(`\nAtlas importer tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
