export function buildUnitySpriteMeta(session) {
  const sprites = [];
  for (const obj of session.objects) {
    if (obj.ignored) continue;
    const [x, y, w, h] = obj.source_bbox;
    const [ox, oy] = obj.origin || [Math.floor(w / 2), h];
    const pivotX = w > 0 ? ox / w : 0.5;
    const pivotY = h > 0 ? oy / h : 1.0;
    const anim = session.animations.find(a => a.id === obj.animation_id);
    const entity = session.entities.find(e => e.id === obj.entity_id);
    sprites.push({
      name: `${slug(entity?.name || 'default')}_${slug(anim?.name || 'frame')}_${String(obj.frame_index >= 0 ? obj.frame_index : 0).padStart(3, '0')}`,
      rect: { x, y, width: w, height: h },
      pivot: { x: pivotX, y: pivotY },
      alignment: 7, // bottom center in Unity
      border: { left: 0, right: 0, top: 0, bottom: 0 }
    });
  }
  return { sprites };
}

function slug(name) {
  return String(name || 'item').toLowerCase().replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
}
