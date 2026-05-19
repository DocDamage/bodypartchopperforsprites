export function findConnectedComponents(mask, width, height, options = {}) {
  const minArea = options.minArea || 20;
  const visited = new Uint8Array(width * height);
  const components = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] && !visited[idx]) {
        const comp = floodFill8(mask, visited, width, height, x, y);
        if (comp.pixels.length >= minArea) {
          components.push(buildComponent(comp, width, height));
        }
      }
    }
  }

  return components;
}

function floodFill8(mask, visited, width, height, sx, sy) {
  const pixels = [];
  const stack = [{ x: sx, y: sy }];
  visited[sy * width + sx] = 1;

  while (stack.length) {
    const { x, y } = stack.pop();
    pixels.push({ x, y });
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = ny * width + nx;
          if (mask[nidx] && !visited[nidx]) {
            visited[nidx] = 1;
            stack.push({ x: nx, y: ny });
          }
        }
      }
    }
  }

  return { pixels };
}

function buildComponent(comp, width, height) {
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let sumX = 0, sumY = 0;
  for (const p of comp.pixels) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
    sumX += p.x;
    sumY += p.y;
  }
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const area = comp.pixels.length;
  return {
    source_bbox: [minX, minY, w, h],
    trimmed_bbox: [minX, minY, w, h],
    centroid: [Math.round(sumX / area), Math.round(sumY / area)],
    area,
    width: w,
    height: h,
    aspect_ratio: w / Math.max(1, h),
    edge_contact: minX === 0 || minY === 0 || maxX === width - 1 || maxY === height - 1,
    pixels: comp.pixels
  };
}

export function computeOpacityStats(imageData, bbox) {
  const [x, y, w, h] = bbox;
  const { width, data } = imageData;
  let minA = 255, maxA = 0, sumA = 0, count = 0;
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const a = data[(py * width + px) * 4 + 3];
      if (a > 0) {
        if (a < minA) minA = a;
        if (a > maxA) maxA = a;
        sumA += a;
        count++;
      }
    }
  }
  if (!count) return { min: 0, max: 0, avg: 0 };
  return { min: minA, max: maxA, avg: Math.round(sumA / count) };
}

export function computeColorHistogram(imageData, bbox, buckets = 8) {
  const [x, y, w, h] = bbox;
  const { width, data } = imageData;
  const hist = new Map();
  const step = Math.max(1, Math.floor((w * h) / 256));
  let samples = 0;
  for (let py = y; py < y + h; py += step) {
    for (let px = x; px < x + w; px += step) {
      const idx = (py * width + px) * 4;
      const a = data[idx + 3];
      if (a < 8) continue;
      const br = Math.floor(data[idx] / (256 / buckets));
      const bg = Math.floor(data[idx + 1] / (256 / buckets));
      const bb = Math.floor(data[idx + 2] / (256 / buckets));
      const key = `${br},${bg},${bb}`;
      hist.set(key, (hist.get(key) || 0) + 1);
      samples++;
    }
  }
  const entries = Array.from(hist.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return entries.map(([color, count]) => ({ color: color.split(',').map(Number), ratio: count / samples }));
}
