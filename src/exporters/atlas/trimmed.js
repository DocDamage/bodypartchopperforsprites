export async function exportTrimmedFrames(session, sourceImage, options = {}) {
  const padding = options.padding || 0;
  const scale = options.scale || 1;
  const objects = session.objects.filter(o => !o.ignored && (options.filterIds ? options.filterIds.includes(o.id) : true));
  const files = [];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = !!options.smoothing;

  for (const obj of objects) {
    const [sx, sy, sw, sh] = obj.trimmed_bbox;
    const pw = Math.max(1, sw + padding * 2);
    const ph = Math.max(1, sh + padding * 2);
    canvas.width = pw * scale;
    canvas.height = ph * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceImage, sx, sy, sw, sh, padding * scale, padding * scale, sw * scale, sh * scale);
    const dataUrl = canvas.toDataURL('image/png');
    const blob = await (await fetch(dataUrl)).blob();
    const buffer = new Uint8Array(await blob.arrayBuffer());
    const entityName = slug(session.entities.find(e => e.id === obj.entity_id)?.name || 'unassigned');
    const animName = slug(session.animations.find(a => a.id === obj.animation_id)?.name || 'frame');
    const name = `${entityName}_${animName}_${String(obj.frame_index >= 0 ? obj.frame_index : 0).padStart(3, '0')}.png`;
    files.push({ name: `entities/${entityName}/animations/${animName}/trimmed/${name}`, data: buffer });
  }

  return files;
}

export async function exportUnassignedFrames(session, sourceImage, options = {}) {
  const padding = options.padding || 0;
  const scale = options.scale || 1;
  const objects = session.objects.filter(o => !o.ignored && !o.entity_id);
  const files = [];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = !!options.smoothing;

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const [sx, sy, sw, sh] = obj.trimmed_bbox;
    const pw = Math.max(1, sw + padding * 2);
    const ph = Math.max(1, sh + padding * 2);
    canvas.width = pw * scale;
    canvas.height = ph * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceImage, sx, sy, sw, sh, padding * scale, padding * scale, sw * scale, sh * scale);
    const dataUrl = canvas.toDataURL('image/png');
    const blob = await (await fetch(dataUrl)).blob();
    const buffer = new Uint8Array(await blob.arrayBuffer());
    files.push({ name: `unassigned/unassigned_${String(i).padStart(3, '0')}.png`, data: buffer });
  }

  return files;
}

function slug(name) {
  return String(name || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'item';
}
