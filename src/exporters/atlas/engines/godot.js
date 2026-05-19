export function buildGodotSpriteFrames(session) {
  const animations = {};
  for (const anim of session.animations) {
    const entity = session.entities.find(e => e.id === anim.entity_id);
    const entityName = slug(entity?.name || 'default');
    const animName = slug(anim.name);
    const key = `${entityName}/${animName}`;
    const frames = [];
    for (const fid of anim.frames) {
      const obj = session.objects.find(o => o.id === fid);
      if (!obj || obj.ignored) continue;
      const [x, y, w, h] = obj.trimmed_bbox;
      const [ox, oy] = obj.origin || [Math.floor(w / 2), h];
      frames.push({
        filename: `${entityName}_${animName}_${String(obj.frame_index >= 0 ? obj.frame_index : 0).padStart(3, '0')}.png`,
        sprite_source_size: { x: 0, y: 0, w, h },
        source_size: { w, h },
        duration: 100
      });
    }
    animations[key] = {
      frames,
      loop: anim.loop,
      speed: anim.fps
    };
  }
  return animations;
}

function slug(name) {
  return String(name || 'item').toLowerCase().replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
}
