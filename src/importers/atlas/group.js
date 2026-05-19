export function groupByRows(objects, options = {}) {
  const rowTolerance = options.rowClusterTolerance || 24;
  const gapThreshold = options.largeGapSplitThreshold || 48;

  // Filter ignored and non-frame objects for row grouping
  const frames = objects.filter(o => !o.ignored && (o.class === 'character_frame' || o.class === 'unknown' || o.class === 'projectile_fx'));
  if (!frames.length) return [];

  // Sort by Y centroid
  const sorted = [...frames].sort((a, b) => a.centroid[1] - b.centroid[1]);

  const rows = [];
  let currentRow = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const yDiff = Math.abs(curr.centroid[1] - prev.centroid[1]);
    if (yDiff <= rowTolerance) {
      currentRow.push(curr);
    } else {
      rows.push(currentRow);
      currentRow = [curr];
    }
  }
  if (currentRow.length) rows.push(currentRow);

  // Within each row, sort left-to-right and split by large gaps
  const result = [];
  for (const row of rows) {
    row.sort((a, b) => a.centroid[0] - b.centroid[0]);
    let group = [row[0]];
    for (let i = 1; i < row.length; i++) {
      const prev = row[i - 1];
      const curr = row[i];
      const xGap = (curr.source_bbox[0]) - (prev.source_bbox[0] + prev.source_bbox[2]);
      if (xGap > gapThreshold) {
        result.push(group);
        group = [curr];
      } else {
        group.push(curr);
      }
    }
    if (group.length) result.push(group);
  }

  return result;
}

export function assignDefaultAnimations(rowGroups, entityId = null) {
  const defaultNames = [
    'idle', 'walk', 'run', 'jump', 'forward_jump', 'crouch', 'block',
    'light_punch', 'medium_punch', 'heavy_punch', 'light_kick', 'medium_kick', 'heavy_kick',
    'special_01', 'special_02', 'throw', 'hitstun', 'knockdown', 'recover', 'stunned',
    'victory', 'taunt', 'timeout', 'ko'
  ];

  const animations = [];
  for (let i = 0; i < rowGroups.length; i++) {
    const name = defaultNames[i] || `animation_${String(i + 1).padStart(2, '0')}`;
    const animId = `anim_${entityId || 'default'}_${name}`;
    const group = rowGroups[i];
    for (let f = 0; f < group.length; f++) {
      group[f].animation_id = animId;
      group[f].frame_index = f;
      group[f].entity_id = entityId;
    }
    animations.push({
      id: animId,
      entity_id: entityId,
      name,
      fps: 8,
      loop: true,
      frames: group.map(o => o.id),
      normalized_canvas: [0, 0],
      origin_mode: 'bottom_center',
      shared_origin: [0, 0]
    });
  }

  return animations;
}

export function computeNormalizedCanvas(frames) {
  if (!frames || !frames.length) return [0, 0];
  let maxW = 0, maxH = 0;
  for (const f of frames) {
    const [x, y, w, h] = f.trimmed_bbox || f.source_bbox;
    const originX = f.origin ? f.origin[0] : Math.floor(w / 2);
    const originY = f.origin ? f.origin[1] : h;
    const neededW = Math.max(originX, w - originX) * 2;
    const neededH = originY + Math.max(0, h - originY);
    if (neededW > maxW) maxW = neededW;
    if (neededH > maxH) maxH = neededH;
  }
  return [maxW, maxH];
}
