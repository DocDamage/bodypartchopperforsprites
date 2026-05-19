export const ATLAS_SESSION_VERSION = '1.0.0';

export function createAtlasSession(source = {}, presetId = 'manual_hybrid') {
  return {
    schema_version: ATLAS_SESSION_VERSION,
    tool: 'the_chopper',
    source: {
      file_name: source.file_name || '',
      width: source.width || 0,
      height: source.height || 0,
      format: source.format || 'png',
      mode: source.mode || 'rgba'
    },
    analysis: {
      sheet_type: 'unknown',
      background: {
        mode: 'unknown',
        color: [0, 0, 0],
        tolerance: 16,
        edge_flood_fill: true
      }
    },
    preset: presetId,
    regions: [],
    objects: [],
    entities: [],
    animations: [],
    export_profiles: [],
    manual_edits: {
      merged_object_ids: [],
      split_object_ids: [],
      ignored_object_ids: [],
      created_objects: [],
      deleted_object_ids: []
    }
  };
}

export function createAtlasObject(props = {}) {
  return {
    id: props.id || `obj_${Math.random().toString(36).slice(2, 10)}`,
    class: props.class || 'unknown',
    source_bbox: props.source_bbox || [0, 0, 0, 0],
    trimmed_bbox: props.trimmed_bbox || [0, 0, 0, 0],
    centroid: props.centroid || [0, 0],
    area: props.area || 0,
    confidence: props.confidence ?? 0.5,
    entity_id: props.entity_id || null,
    animation_id: props.animation_id || null,
    frame_index: props.frame_index ?? -1,
    origin: props.origin || [0, 0],
    baseline_y: props.baseline_y ?? 0,
    variant: props.variant || 'default',
    ignored: props.ignored || false,
    width: props.width || 0,
    height: props.height || 0,
    aspect_ratio: props.aspect_ratio || 1,
    color_histogram: props.color_histogram || [],
    opacity_stats: props.opacity_stats || null,
    edge_contact: props.edge_contact || false
  };
}

export function createEntity(props = {}) {
  return {
    id: props.id || `entity_${Math.random().toString(36).slice(2, 10)}`,
    name: props.name || 'Unnamed Entity',
    source_region_ids: props.source_region_ids || [],
    animations: props.animations || [],
    variants: props.variants || ['default'],
    portraits: props.portraits || [],
    mugshots: props.mugshots || [],
    fx: props.fx || []
  };
}

export function createAnimation(props = {}) {
  return {
    id: props.id || `anim_${Math.random().toString(36).slice(2, 10)}`,
    entity_id: props.entity_id || null,
    name: props.name || 'unnamed',
    fps: props.fps ?? 8,
    loop: props.loop ?? true,
    frames: props.frames || [],
    normalized_canvas: props.normalized_canvas || [0, 0],
    origin_mode: props.origin_mode || 'bottom_center',
    shared_origin: props.shared_origin || [0, 0]
  };
}

export function createRegion(props = {}) {
  return {
    id: props.id || `region_${Math.random().toString(36).slice(2, 10)}`,
    type: props.type || 'section',
    bbox: props.bbox || [0, 0, 0, 0],
    name: props.name || '',
    entity_id: props.entity_id || null,
    animation_id: props.animation_id || null
  };
}

export function migrateAtlasSession(session) {
  if (!session) return createAtlasSession();
  const base = createAtlasSession(session.source, session.preset);
  return {
    ...base,
    ...session,
    schema_version: ATLAS_SESSION_VERSION,
    analysis: { ...base.analysis, ...(session.analysis || {}) },
    manual_edits: { ...base.manual_edits, ...(session.manual_edits || {}) }
  };
}
