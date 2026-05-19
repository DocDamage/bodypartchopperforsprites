export function mergeNearbyComponents(components, options = {}) {
  const charDist = options.characterMergeDistance || 12;
  const projDist = options.projectileMergeDistance || 6;
  const maxMergedArea = options.maxMergedArea || 50000;
  const maxMergedWidth = options.maxMergedWidth || 512;
  const maxMergedHeight = options.maxMergedHeight || 512;

  const groups = [];
  const assigned = new Set();

  for (let i = 0; i < components.length; i++) {
    if (assigned.has(i)) continue;
    const group = [i];
    assigned.add(i);
    const queue = [i];

    while (queue.length) {
      const currentIdx = queue.pop();
      const current = components[currentIdx];
      const mergeDist = (current.class === 'projectile_fx' || current.class === 'impact_fx') ? projDist : charDist;

      for (let j = 0; j < components.length; j++) {
        if (assigned.has(j)) continue;
        const other = components[j];
        const dist = boxDistance(current.source_bbox, other.source_bbox);
        if (dist <= mergeDist && canMerge(current, other, maxMergedArea, maxMergedWidth, maxMergedHeight)) {
          group.push(j);
          assigned.add(j);
          queue.push(j);
        }
      }
    }

    groups.push(group);
  }

  return groups.map(indices => mergeGroup(components, indices));
}

function boxDistance(a, b) {
  const [ax, ay, aw, ah] = a;
  const [bx, by, bw, bh] = b;
  const aRight = ax + aw, aBottom = ay + ah;
  const bRight = bx + bw, bBottom = by + bh;

  if (ax <= bRight && aRight >= bx && ay <= bBottom && aBottom >= by) return 0;

  let dx = 0, dy = 0;
  if (aRight < bx) dx = bx - aRight;
  else if (bRight < ax) dx = ax - bRight;
  if (aBottom < by) dy = by - aBottom;
  else if (bBottom < ay) dy = ay - bBottom;

  return Math.max(dx, dy);
}

function canMerge(a, b, maxArea, maxW, maxH) {
  const [ax, ay, aw, ah] = a.source_bbox;
  const [bx, by, bw, bh] = b.source_bbox;
  const minX = Math.min(ax, bx), minY = Math.min(ay, by);
  const maxX = Math.max(ax + aw, bx + bw), maxY = Math.max(ay + ah, by + bh);
  const mergedW = maxX - minX, mergedH = maxY - minY;
  const mergedArea = mergedW * mergedH;

  if (mergedArea > maxArea) return false;
  if (mergedW > maxW || mergedH > maxH) return false;

  // Do not merge text/palette/border with character frames
  const nonSpriteClasses = new Set(['text_label', 'palette_strip', 'divider_line', 'panel_border', 'annotation_arrow']);
  const aIsNonSprite = nonSpriteClasses.has(a.class);
  const bIsNonSprite = nonSpriteClasses.has(b.class);
  if (aIsNonSprite !== bIsNonSprite) return false;

  return true;
}

function mergeGroup(components, indices) {
  if (indices.length === 1) return { ...components[indices[0]] };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let sumX = 0, sumY = 0, totalArea = 0;
  const mergedPixels = [];

  for (const idx of indices) {
    const c = components[idx];
    const [x, y, w, h] = c.source_bbox;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + w > maxX) maxX = x + w;
    if (y + h > maxY) maxY = y + h;
    sumX += c.centroid[0] * c.area;
    sumY += c.centroid[1] * c.area;
    totalArea += c.area;
    if (c.pixels) mergedPixels.push(...c.pixels);
  }

  const w = maxX - minX;
  const h = maxY - minY;

  return {
    source_bbox: [minX, minY, w, h],
    trimmed_bbox: [minX, minY, w, h],
    centroid: [Math.round(sumX / totalArea), Math.round(sumY / totalArea)],
    area: totalArea,
    width: w,
    height: h,
    aspect_ratio: w / Math.max(1, h),
    edge_contact: components[indices[0]].edge_contact,
    pixels: mergedPixels,
    class: components[indices[0]].class,
    confidence: Math.min(1, components[indices[0]].confidence + 0.05),
    _merged_from: indices.map(i => components[i].id)
  };
}
