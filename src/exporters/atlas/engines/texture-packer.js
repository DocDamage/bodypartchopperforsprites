export function buildTexturePackerJson(session) {
  const frames = [];
  for (const obj of session.objects) {
    if (obj.ignored) continue;
    const [x, y, w, h] = obj.trimmed_bbox;
    const [ox, oy] = obj.origin || [Math.floor(w / 2), h];
    const anim = session.animations.find(a => a.id === obj.animation_id);
    const entity = session.entities.find(e => e.id === obj.entity_id);
    frames.push({
      filename: `${slug(entity?.name || 'default')}_${slug(anim?.name || 'frame')}_${String(obj.frame_index >= 0 ? obj.frame_index : 0).padStart(3, '0')}.png`,
      frame: { x, y, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      pivot: { x: w > 0 ? ox / w : 0.5, y: h > 0 ? oy / h : 1.0 }
    });
  }
  return {
    frames,
    meta: {
      app: 'the_chopper',
      version: '1.0.0',
      image: session.source.file_name,
      format: 'RGBA8888',
      size: { w: session.source.width, h: session.source.height },
      scale: 1
    }
  };
}

function slug(name) {
  return String(name || 'item').toLowerCase().replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
}
