import { analyzeSource } from './analyzer.js';
import { detectBackgroundModel, buildForegroundMask } from './background.js';
import { findConnectedComponents, computeOpacityStats, computeColorHistogram } from './components.js';
import { mergeNearbyComponents } from './merge.js';
import { classifyObjects } from './classify.js';
import { groupByRows, assignDefaultAnimations, computeNormalizedCanvas } from './group.js';
import { detectPanels } from './panels.js';
import { getPreset } from './presets.js';
import { createAtlasSession, createAtlasObject, createEntity, createRegion } from './session.js';

export function runAtlasPipeline(sourceData, presetId = 'manual_hybrid', options = {}) {
  const { imageData, width, height, file_name, format, mode } = sourceData;
  const preset = getPreset(presetId);
  const session = createAtlasSession({ file_name, width, height, format, mode }, presetId);

  // Phase 1: Preflight analysis
  const analysis = analyzeSource(imageData);
  session.analysis = {
    sheet_type: analysis.sheet_type_guess,
    background: detectBackgroundModel(analysis, preset),
    object_density: analysis.object_density,
    estimated_scale: analysis.estimated_average_scale,
    line_score: analysis.line_score
  };

  // Phase 2: Background removal / mask building
  const mask = buildForegroundMask(imageData, {
    mode: session.analysis.background.mode,
    color: session.analysis.background.color,
    tolerance: session.analysis.background.tolerance,
    edgeFloodFill: session.analysis.background.edge_flood_fill
  });
  session.mask = Array.from(mask); // serialize for session

  // Phase 3: Structural region detection (panels)
  if (preset.panelDetection) {
    const { panels } = detectPanels(imageData, {
      minPanelWidth: preset.minObjectArea * 2,
      minPanelHeight: preset.minObjectArea * 2
    });
    session.regions = panels.map(p => createRegion(p));
  }

  // Phase 4: Connected component detection
  let components = findConnectedComponents(mask, width, height, {
    minArea: preset.minObjectArea
  });

  // Phase 5: Merge pass
  const merged = mergeNearbyComponents(components, {
    characterMergeDistance: preset.characterMergeDistance,
    projectileMergeDistance: preset.projectileMergeDistance
  });

  // Phase 6: Classification
  const classified = classifyObjects(merged, analysis, preset);

  // Build session objects
  session.objects = classified.map((c, idx) => {
    const opacity = computeOpacityStats(imageData, c.trimmed_bbox);
    const hist = computeColorHistogram(imageData, c.trimmed_bbox);
    return createAtlasObject({
      id: `obj_${String(idx).padStart(6, '0')}`,
      class: c.class,
      source_bbox: c.source_bbox,
      trimmed_bbox: c.trimmed_bbox,
      centroid: c.centroid,
      area: c.area,
      confidence: c.confidence,
      width: c.width,
      height: c.height,
      aspect_ratio: Math.round(c.aspect_ratio * 100) / 100,
      opacity_stats: opacity,
      color_histogram: hist,
      edge_contact: c.edge_contact,
      ignored: c.class === 'divider_line' || c.class === 'panel_border' || c.class === 'palette_strip' || c.class === 'text_label'
    });
  });

  // Phase 7: Grouping
  const activeObjects = session.objects.filter(o => !o.ignored);
  const rowGroups = groupByRows(activeObjects, {
    rowClusterTolerance: preset.rowClusterTolerance,
    largeGapSplitThreshold: preset.largeGapSplitThreshold
  });

  // Phase 8: Create default entity and animations
  const entity = createEntity({ id: 'entity_default', name: 'Default Entity' });
  session.entities = [entity];
  session.animations = assignDefaultAnimations(rowGroups, entity.id);

  // Update objects with assigned animation/frame_index
  for (const anim of session.animations) {
    for (let i = 0; i < anim.frames.length; i++) {
      const objId = anim.frames[i];
      const obj = session.objects.find(o => o.id === objId);
      if (obj) {
        obj.animation_id = anim.id;
        obj.frame_index = i;
        obj.entity_id = anim.entity_id;
      }
    }
  }

  // Set default origins (bottom-center)
  for (const obj of session.objects) {
    if (obj.ignored) continue;
    const [x, y, w, h] = obj.trimmed_bbox;
    obj.origin = [Math.floor(w / 2), h];
    obj.baseline_y = h;
  }

  // Compute normalized canvas for each animation
  for (const anim of session.animations) {
    const frames = session.objects.filter(o => o.animation_id === anim.id && !o.ignored);
    anim.normalized_canvas = computeNormalizedCanvas(frames);
    anim.shared_origin = frames.length ? frames[0].origin : [0, 0];
  }

  return session;
}

export function reanalyzeRegion(session, sourceData, regionBbox, presetId) {
  // Run detection inside a specific region only
  const { imageData, width, height } = sourceData;
  const preset = getPreset(presetId);

  // Build a sub-mask for the region
  const mask = new Uint8Array(width * height);
  const fullMask = buildForegroundMask(imageData, {
    mode: session.analysis.background.mode,
    color: session.analysis.background.color,
    tolerance: session.analysis.background.tolerance,
    edgeFloodFill: session.analysis.background.edge_flood_fill
  });

  const [rx, ry, rw, rh] = regionBbox;
  for (let y = ry; y < ry + rh && y < height; y++) {
    for (let x = rx; x < rx + rw && x < width; x++) {
      const idx = y * width + x;
      mask[idx] = fullMask[idx];
    }
  }

  const components = findConnectedComponents(mask, width, height, {
    minArea: preset.minObjectArea
  });

  const merged = mergeNearbyComponents(components, {
    characterMergeDistance: preset.characterMergeDistance,
    projectileMergeDistance: preset.projectileMergeDistance
  });

  // Reclassify within region context
  const analysis = {
    sheet_type_guess: session.analysis.sheet_type,
    estimated_average_scale: session.analysis.estimated_scale,
    width,
    height
  };
  const classified = classifyObjects(merged, analysis, preset);

  return classified.map((c, idx) => createAtlasObject({
    id: `obj_reg_${String(idx).padStart(6, '0')}`,
    class: c.class,
    source_bbox: c.source_bbox,
    trimmed_bbox: c.trimmed_bbox,
    centroid: c.centroid,
    area: c.area,
    confidence: c.confidence,
    width: c.width,
    height: c.height,
    aspect_ratio: Math.round(c.aspect_ratio * 100) / 100,
    edge_contact: c.edge_contact,
    ignored: c.class === 'divider_line' || c.class === 'panel_border' || c.class === 'palette_strip' || c.class === 'text_label'
  }));
}
