import { getPixelAt } from './loader.js';

export const BACKGROUND_MODELS = Object.freeze({
  TRANSPARENT_ALPHA: 'transparent_alpha',
  SOLID_CHROMA_EDGE_COLOR: 'solid_chroma_edge_color',
  SOLID_CHROMA_DOMINANT_COLOR: 'solid_chroma_dominant_color',
  DARK_PRESENTATION_BACKGROUND: 'dark_presentation_background',
  MULTI_BACKGROUND_PANEL_SHEET: 'multi_background_panel_sheet',
  UNKNOWN: 'unknown'
});

export function buildForegroundMask(imageData, options = {}) {
  const { mode = 'unknown', color = [0, 0, 0], tolerance = 16, edgeFloodFill = true } = options;
  const { width, height, data } = imageData;
  const mask = new Uint8Array(width * height);

  if (mode === BACKGROUND_MODELS.TRANSPARENT_ALPHA) {
    const alphaThreshold = options.alphaThreshold || 8;
    for (let i = 0; i < width * height; i++) {
      mask[i] = data[i * 4 + 3] > alphaThreshold ? 1 : 0;
    }
    return mask;
  }

  if (edgeFloodFill && (mode === BACKGROUND_MODELS.SOLID_CHROMA_EDGE_COLOR || mode === BACKGROUND_MODELS.SOLID_CHROMA_DOMINANT_COLOR)) {
    // Flood fill from edges using color tolerance
    const visited = new Uint8Array(width * height);
    const stack = [];

    // Seed all edge pixels that match background color
    for (let x = 0; x < width; x++) {
      pushIfBg(stack, visited, width, height, data, x, 0, color, tolerance);
      pushIfBg(stack, visited, width, height, data, x, height - 1, color, tolerance);
    }
    for (let y = 1; y < height - 1; y++) {
      pushIfBg(stack, visited, width, height, data, 0, y, color, tolerance);
      pushIfBg(stack, visited, width, height, data, width - 1, y, color, tolerance);
    }

    while (stack.length) {
      const { x, y } = stack.pop();
      const idx = y * width + x;
      mask[idx] = 0; // background
      const neighbors = [
        { x: x - 1, y }, { x: x + 1, y },
        { x, y: y - 1 }, { x, y: y + 1 }
      ];
      for (const n of neighbors) {
        if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
          pushIfBg(stack, visited, width, height, data, n.x, n.y, color, tolerance);
        }
      }
    }

    // Everything not visited is foreground
    for (let i = 0; i < width * height; i++) {
      if (!visited[i]) mask[i] = 1;
    }
    return mask;
  }

  // Fallback: global chroma deletion (not recommended as default)
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    const isBg = a < 8 || (Math.abs(r - color[0]) <= tolerance && Math.abs(g - color[1]) <= tolerance && Math.abs(b - color[2]) <= tolerance);
    mask[i] = isBg ? 0 : 1;
  }
  return mask;
}

function pushIfBg(stack, visited, width, height, data, x, y, color, tolerance) {
  const idx = y * width + x;
  if (visited[idx]) return;
  const r = data[idx * 4], g = data[idx * 4 + 1], b = data[idx * 4 + 2], a = data[idx * 4 + 3];
  if (a < 8) {
    visited[idx] = 1;
    stack.push({ x, y });
    return;
  }
  if (Math.abs(r - color[0]) <= tolerance && Math.abs(g - color[1]) <= tolerance && Math.abs(b - color[2]) <= tolerance) {
    visited[idx] = 1;
    stack.push({ x, y });
  }
}

export function detectBackgroundModel(analysis, preset) {
  if (preset.backgroundMode && preset.backgroundMode !== BACKGROUND_MODELS.UNKNOWN) {
    return {
      mode: preset.backgroundMode,
      color: analysis.dominant_colors.edge,
      tolerance: preset.tolerance,
      edge_flood_fill: preset.edgeFloodFill
    };
  }

  const candidates = analysis.background_candidates;
  const best = candidates[0];
  if (best.type === 'transparent_alpha') {
    return { mode: BACKGROUND_MODELS.TRANSPARENT_ALPHA, color: [0, 0, 0], tolerance: 8, edge_flood_fill: false };
  }
  if (best.type === 'edge_color' && best.confidence > 0.6) {
    return { mode: BACKGROUND_MODELS.SOLID_CHROMA_EDGE_COLOR, color: best.color, tolerance: 16, edge_flood_fill: true };
  }
  if (best.type === 'dominant_color' && best.confidence > 0.5) {
    return { mode: BACKGROUND_MODELS.SOLID_CHROMA_DOMINANT_COLOR, color: best.color, tolerance: 16, edge_flood_fill: true };
  }
  return { mode: BACKGROUND_MODELS.UNKNOWN, color: best.color || [0, 0, 0], tolerance: 16, edge_flood_fill: true };
}
