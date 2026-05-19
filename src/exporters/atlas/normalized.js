export async function exportNormalizedFrames(session, sourceImage, options = {}) {
  const padding = options.padding || 0;
  const scale = options.scale || 1;
  const files = [];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = !!options.smoothing;

  for (const anim of session.animations) {
    const frames = session.objects.filter(o => o.animation_id === anim.id && !o.ignored);
    if (!frames.length) continue;

    const [cw, ch] = anim.normalized_canvas;
    const canvasW = Math.max(1, (cw + padding * 2) * scale);
    const canvasH = Math.max(1, (ch + padding * 2) * scale);

    for (const obj of frames) {
      canvas.width = canvasW;
      canvas.height = canvasH;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const [sx, sy, sw, sh] = obj.trimmed_bbox;
      const [ox, oy] = obj.origin || anim.shared_origin || [Math.floor(sw / 2), sh];
      const destX = (padding + (cw / 2) - ox) * scale;
      const destY = (padding + (ch - oy)) * scale;

      ctx.drawImage(sourceImage, sx, sy, sw, sh, destX, destY, sw * scale, sh * scale);

      const dataUrl = canvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const buffer = new Uint8Array(await blob.arrayBuffer());
      const entityName = slug(session.entities.find(e => e.id === anim.entity_id)?.name || 'unassigned');
      const animName = slug(anim.name);
      const name = `${entityName}_${animName}_${String(obj.frame_index >= 0 ? obj.frame_index : 0).padStart(3, '0')}.png`;
      files.push({ name: `entities/${entityName}/animations/${animName}/normalized/${name}`, data: buffer });
    }
  }

  return files;
}

function slug(name) {
  return String(name || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'item';
}
