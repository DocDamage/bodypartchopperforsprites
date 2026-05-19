export function buildExportMetadata(session) {
  const objects = session.objects.map(o => ({
    id: o.id,
    class: o.class,
    source_bbox: o.source_bbox,
    trimmed_bbox: o.trimmed_bbox,
    centroid: o.centroid,
    area: o.area,
    confidence: o.confidence,
    entity_id: o.entity_id,
    animation_id: o.animation_id,
    frame_index: o.frame_index,
    origin: o.origin,
    baseline_y: o.baseline_y,
    variant: o.variant,
    ignored: o.ignored
  }));

  const animations = session.animations.map(a => ({
    id: a.id,
    entity_id: a.entity_id,
    name: a.name,
    fps: a.fps,
    loop: a.loop,
    frames: a.frames,
    normalized_canvas: a.normalized_canvas,
    origin_mode: a.origin_mode,
    shared_origin: a.shared_origin
  }));

  const entities = session.entities.map(e => ({
    id: e.id,
    name: e.name,
    source_region_ids: e.source_region_ids,
    animations: e.animations,
    variants: e.variants,
    portraits: e.portraits,
    mugshots: e.mugshots,
    fx: e.fx
  }));

  return {
    schema_version: session.schema_version,
    source: session.source,
    analysis: session.analysis,
    preset: session.preset,
    entities,
    animations,
    objects,
    regions: session.regions || []
  };
}

export function buildAtlasJson(session) {
  const activeObjects = session.objects.filter(o => !o.ignored);
  let packX = 0, packY = 0, rowH = 0;
  const maxWidth = 2048;
  const padding = 2;
  const frames = [];

  for (const obj of activeObjects) {
    const [x, y, w, h] = obj.trimmed_bbox;
    if (packX + w + padding > maxWidth) {
      packX = 0;
      packY += rowH + padding;
      rowH = 0;
    }
    frames.push({
      name: obj.id,
      source: { x, y, w, h },
      atlas: { x: packX, y: packY, w, h }
    });
    packX += w + padding;
    if (h > rowH) rowH = h;
  }

  const atlasHeight = packY + rowH + padding;

  return {
    name: 'atlas',
    width: maxWidth,
    height: atlasHeight,
    padding,
    frames
  };
}
