export function detectPanels(imageData, options = {}) {
  const { width, height, data } = imageData;
  const minPanelW = options.minPanelWidth || 24;
  const minPanelH = options.minPanelHeight || 24;
  const lineColorTolerance = options.lineColorTolerance || 48;
  const antiAliasTolerance = options.antiAliasTolerance || 64;

  // Detect long horizontal lines
  const hLines = [];
  const scanStep = Math.max(1, Math.floor(height / 100));
  for (let y = 0; y < height; y += scanStep) {
    let runStart = 0;
    let runColor = null;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const color = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
      if (runColor === null) {
        runColor = color;
        runStart = x;
      } else if (!colorSimilar(runColor, color, antiAliasTolerance)) {
        const runLen = x - runStart;
        if (runLen >= width * 0.25) {
          hLines.push({ y, x1: runStart, x2: x - 1, color: [...runColor], length: runLen });
        }
        runColor = color;
        runStart = x;
      }
    }
    if (runColor) {
      const runLen = width - runStart;
      if (runLen >= width * 0.25) {
        hLines.push({ y, x1: runStart, x2: width - 1, color: [...runColor], length: runLen });
      }
    }
  }

  // Detect long vertical lines
  const vLines = [];
  const vScanStep = Math.max(1, Math.floor(width / 100));
  for (let x = 0; x < width; x += vScanStep) {
    let runStart = 0;
    let runColor = null;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const color = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
      if (runColor === null) {
        runColor = color;
        runStart = y;
      } else if (!colorSimilar(runColor, color, antiAliasTolerance)) {
        const runLen = y - runStart;
        if (runLen >= height * 0.25) {
          vLines.push({ x, y1: runStart, y2: y - 1, color: [...runColor], length: runLen });
        }
        runColor = color;
        runStart = y;
      }
    }
    if (runColor) {
      const runLen = height - runStart;
      if (runLen >= height * 0.25) {
        vLines.push({ x, y1: runStart, y2: height - 1, color: [...runColor], length: runLen });
      }
    }
  }

  // Cluster line positions with anti-aliased tolerance
  const hPositions = clusterLinePositions(hLines, 'y', 6);
  const vPositions = clusterLinePositions(vLines, 'x', 6);

  // Build panels from line intersections
  const panels = [];
  for (let i = 0; i < hPositions.length - 1; i++) {
    for (let j = 0; j < vPositions.length - 1; j++) {
      const y1 = hPositions[i];
      const y2 = hPositions[i + 1];
      const x1 = vPositions[j];
      const x2 = vPositions[j + 1];
      const pw = x2 - x1;
      const ph = y2 - y1;
      if (pw >= minPanelW && ph >= minPanelH) {
        panels.push({
          id: `panel_${i}_${j}`,
          type: 'panel',
          bbox: [x1, y1, pw, ph],
          name: `panel_${String(panels.length + 1).padStart(2, '0')}`,
          entity_id: null,
          animation_id: null
        });
      }
    }
  }

  return { panels, hLines, vLines };
}

function colorSimilar(a, b, tolerance) {
  return Math.abs(a[0] - b[0]) <= tolerance &&
         Math.abs(a[1] - b[1]) <= tolerance &&
         Math.abs(a[2] - b[2]) <= tolerance &&
         Math.abs(a[3] - b[3]) <= tolerance;
}

function clusterLinePositions(lines, key, threshold) {
  if (!lines.length) return [];
  const values = lines.map(l => l[key]).sort((a, b) => a - b);
  const clusters = [];
  let current = [values[0]];
  for (let i = 1; i < values.length; i++) {
    if (values[i] - current[current.length - 1] <= threshold) {
      current.push(values[i]);
    } else {
      clusters.push(Math.round(current.reduce((s, v) => s + v, 0) / current.length));
      current = [values[i]];
    }
  }
  if (current.length) clusters.push(Math.round(current.reduce((s, v) => s + v, 0) / current.length));
  return clusters;
}
