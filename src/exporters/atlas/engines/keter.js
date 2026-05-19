export function buildKeterAtlasJson(session) {
  const sprites = [];
  const animations = [];

  for (const obj of session.objects) {
    if (obj.ignored) continue;
    const [x, y, w, h] = obj.trimmed_bbox;
    const [ox, oy] = obj.origin || [Math.floor(w / 2), h];
    const anim = session.animations.find(a => a.id === obj.animation_id);
    const entity = session.entities.find(e => e.id === obj.entity_id);
    sprites.push({
      name: `${slug(entity?.name || 'default')}_${slug(anim?.name || 'frame')}_${String(obj.frame_index >= 0 ? obj.frame_index : 0).padStart(3, '0')}`,
      source: { x, y, w, h },
      origin: { x: ox, y: oy },
      baseline_y: obj.baseline_y || h
    });
  }

  for (const anim of session.animations) {
    const entity = session.entities.find(e => e.id === anim.entity_id);
    animations.push({
      name: slug(anim.name),
      entity: slug(entity?.name || 'default'),
      fps: anim.fps,
      loop: anim.loop,
      frames: anim.frames.filter(id => {
        const obj = session.objects.find(o => o.id === id);
        return obj && !obj.ignored;
      }),
      normalized_canvas: anim.normalized_canvas,
      origin_mode: anim.origin_mode,
      shared_origin: anim.shared_origin
    });
  }

  return { sprites, animations };
}

function slug(name) {
  return String(name || 'item').toLowerCase().replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
}
