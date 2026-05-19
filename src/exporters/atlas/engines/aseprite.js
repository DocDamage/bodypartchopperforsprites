export function buildAsepriteJson(session) {
  const frames = {};
  const frameTags = [];
  let frameCounter = 0;

  for (const anim of session.animations) {
    const entity = session.entities.find(e => e.id === anim.entity_id);
    const animName = slug(anim.name);
    const from = frameCounter;
    for (const fid of anim.frames) {
      const obj = session.objects.find(o => o.id === fid);
      if (!obj || obj.ignored) continue;
      const [x, y, w, h] = obj.trimmed_bbox;
      const key = `${slug(entity?.name || 'default')}_${animName}_${String(frameCounter).padStart(3, '0')}`;
      frames[key] = {
        frame: { x, y, w, h },
        spriteSourceSize: { x: 0, y: 0, w, h },
        sourceSize: { w, h },
        duration: Math.round(1000 / (anim.fps || 8))
      };
      frameCounter++;
    }
    const to = frameCounter - 1;
    if (to >= from) {
      frameTags.push({ name: animName, from, to, direction: 'forward' });
    }
  }

  return {
    frames,
    meta: {
      app: 'the_chopper',
      version: '1.0.0',
      format: 'RGBA8888',
      size: { w: session.source.width, h: session.source.height },
      scale: '1',
      frameTags,
      layers: [{ name: 'Layer 1', opacity: 255, blendMode: 'normal' }]
    }
  };
}

function slug(name) {
  return String(name || 'item').toLowerCase().replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
}
