import { getPixelAt } from './loader.js';

export function analyzeSource(imageData) {
  const { width, height, data } = imageData;
  const totalPixels = width * height;

  // Edge sampling
  const edgeColors = [];
  for (let x = 0; x < width; x++) {
    edgeColors.push(getPixelAt(imageData, x, 0));
    edgeColors.push(getPixelAt(imageData, x, height - 1));
  }
  for (let y = 1; y < height - 1; y++) {
    edgeColors.push(getPixelAt(imageData, 0, y));
    edgeColors.push(getPixelAt(imageData, width - 1, y));
  }

  const edgeDominant = dominantColor(edgeColors);
  const fullDominant = dominantColorFromImageData(imageData);
  const topLeft = getPixelAt(imageData, 0, 0);

  // Alpha stats
  let transparentPixels = 0;
  let opaquePixels = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 8) transparentPixels++;
    else opaquePixels++;
  }
  const transparencyRatio = transparentPixels / totalPixels;

  // Object density estimate: sample grid and count color changes
  const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 64));
  let colorChangeCount = 0;
  let prevColor = null;
  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const c = getPixelAt(imageData, x, y);
      const key = `${c[0]},${c[1]},${c[2]},${c[3]}`;
      if (prevColor && prevColor !== key) colorChangeCount++;
      prevColor = key;
    }
  }
  const objectDensity = colorChangeCount / ((width / sampleStep) * (height / sampleStep));

  // Line detection (simple horizontal/vertical line score)
  const lineScore = detectLineScore(imageData);

  // Estimated average object scale from edge-to-edge distances
  const estimatedScale = estimateAverageObjectScale(imageData, edgeDominant.color);

  // Background candidates
  const candidates = [
    { type: 'edge_color', color: edgeDominant.color, confidence: edgeDominant.confidence },
    { type: 'dominant_color', color: fullDominant.color, confidence: fullDominant.confidence },
    { type: 'top_left', color: topLeft, confidence: 0.5 }
  ];

  if (transparencyRatio > 0.3) {
    candidates.unshift({ type: 'transparent_alpha', color: [0, 0, 0, 0], confidence: Math.min(1, transparencyRatio) });
  }

  // Sheet type inference
  const sheetType = inferSheetType({
    transparencyRatio,
    lineScore,
    objectDensity,
    estimatedScale,
    edgeDominant,
    width,
    height
  });

  return {
    width,
    height,
    total_pixels: totalPixels,
    format_hints: {
      has_alpha: transparencyRatio > 0,
      transparency_ratio: Math.round(transparencyRatio * 100) / 100
    },
    dominant_colors: {
      edge: edgeDominant.color,
      full: fullDominant.color,
      top_left: topLeft
    },
    background_candidates: candidates,
    object_density: Math.round(objectDensity * 100) / 100,
    estimated_average_scale: estimatedScale,
    line_score: lineScore,
    sheet_type_guess: sheetType
  };
}

function dominantColor(colors) {
  const map = new Map();
  for (const c of colors) {
    const key = `${c[0]},${c[1]},${c[2]}`;
    map.set(key, (map.get(key) || 0) + 1);
  }
  let bestKey = null;
  let bestCount = 0;
  for (const [k, v] of map) {
    if (v > bestCount) {
      bestCount = v;
      bestKey = k;
    }
  }
  const rgb = bestKey ? bestKey.split(',').map(Number) : [0, 0, 0];
  return { color: rgb, confidence: colors.length ? bestCount / colors.length : 0 };
}

function dominantColorFromImageData(imageData) {
  const map = new Map();
  const { data } = imageData;
  const step = Math.max(1, Math.floor(data.length / 4 / 5000));
  let samples = 0;
  for (let i = 0; i < data.length; i += 4 * step) {
    const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    map.set(key, (map.get(key) || 0) + 1);
    samples++;
  }
  let bestKey = null;
  let bestCount = 0;
  for (const [k, v] of map) {
    if (v > bestCount) {
      bestCount = v;
      bestKey = k;
    }
  }
  const rgb = bestKey ? bestKey.split(',').map(Number) : [0, 0, 0];
  return { color: rgb, confidence: samples ? bestCount / samples : 0 };
}

function detectLineScore(imageData) {
  const { width, height, data } = imageData;
  let horizontalLines = 0;
  let verticalLines = 0;
  const scanStep = Math.max(1, Math.floor(height / 32));

  for (let y = 1; y < height - 1; y += scanStep) {
    let run = 1;
    for (let x = 1; x < width; x++) {
      const idx = (y * width + x) * 4;
      const pidx = (y * width + (x - 1)) * 4;
      const same = data[idx] === data[pidx] && data[idx + 1] === data[pidx + 1] && data[idx + 2] === data[pidx + 2] && data[idx + 3] === data[pidx + 3];
      if (same) run++;
      else {
        if (run > width * 0.4) horizontalLines++;
        run = 1;
      }
    }
  }

  for (let x = 1; x < width - 1; x += scanStep) {
    let run = 1;
    for (let y = 1; y < height; y++) {
      const idx = (y * width + x) * 4;
      const pidx = ((y - 1) * width + x) * 4;
      const same = data[idx] === data[pidx] && data[idx + 1] === data[pidx + 1] && data[idx + 2] === data[pidx + 2] && data[idx + 3] === data[pidx + 3];
      if (same) run++;
      else {
        if (run > height * 0.4) verticalLines++;
        run = 1;
      }
    }
  }

  return { horizontal: horizontalLines, vertical: verticalLines, total: horizontalLines + verticalLines };
}

function estimateAverageObjectScale(imageData, bgColor) {
  const { width, height, data } = imageData;
  const bg = bgColor || [0, 0, 0];
  let minW = width, minH = height;
  let found = false;

  // Simple scan: find non-bg runs
  for (let y = 0; y < height; y += 4) {
    let inObj = false;
    let startX = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const isBg = Math.abs(data[idx] - bg[0]) < 16 && Math.abs(data[idx + 1] - bg[1]) < 16 && Math.abs(data[idx + 2] - bg[2]) < 16;
      if (!isBg && data[idx + 3] > 8) {
        if (!inObj) { inObj = true; startX = x; }
      } else {
        if (inObj) {
          const run = x - startX;
          if (run > 2 && run < minW) minW = run;
          found = true;
          inObj = false;
        }
      }
    }
  }

  for (let x = 0; x < width; x += 4) {
    let inObj = false;
    let startY = 0;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const isBg = Math.abs(data[idx] - bg[0]) < 16 && Math.abs(data[idx + 1] - bg[1]) < 16 && Math.abs(data[idx + 2] - bg[2]) < 16;
      if (!isBg && data[idx + 3] > 8) {
        if (!inObj) { inObj = true; startY = y; }
      } else {
        if (inObj) {
          const run = y - startY;
          if (run > 2 && run < minH) minH = run;
          found = true;
          inObj = false;
        }
      }
    }
  }

  return found ? Math.max(8, Math.min(minW, minH)) : 32;
}

function inferSheetType(signals) {
  const { transparencyRatio, lineScore, estimatedScale, width, height } = signals;

  if (lineScore.total >= 3) return 'panel_fighting';
  if (transparencyRatio > 0.4) return 'transparent_atlas';
  if (estimatedScale < 20 && width < 400 && height < 400) return 'jrpg_tiny';
  if (width > 1200 || height > 1200) return 'compilation';
  if (transparencyRatio > 0.05 && transparencyRatio < 0.4) return 'freeform_fighting';
  return 'uniform_grid';
}
