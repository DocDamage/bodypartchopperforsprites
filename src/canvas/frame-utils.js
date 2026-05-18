export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function frameCell(grid, row, col) {
  return {
    x: grid.marginX + col * (grid.frameW + grid.spacingX),
    y: grid.marginY + row * (grid.frameH + grid.spacingY),
    w: grid.frameW,
    h: grid.frameH
  };
}

export function forEachCell(grid, callback) {
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      callback(row, col, frameCell(grid, row, col));
    }
  }
}

export function frameFromPoint(grid, point) {
  const col = Math.floor((point.x - grid.marginX) / (grid.frameW + grid.spacingX));
  const row = Math.floor((point.y - grid.marginY) / (grid.frameH + grid.spacingY));
  return {
    row: clamp(row, 0, grid.rows - 1),
    col: clamp(col, 0, grid.cols - 1)
  };
}

export function rectFromPoints(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) };
}

export function bboxOfPoints(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    x,
    y,
    w: Math.max(...xs) - x,
    h: Math.max(...ys) - y
  };
}

export function detectGridFromImageSize(width, height, currentGrid = {}) {
  const candidates = [16, 24, 32, 48, 64, 96, 128, 192];
  let best = {
    frameW: currentGrid.frameW || 64,
    frameH: currentGrid.frameH || 64,
    cols: Math.max(1, Math.floor(width / (currentGrid.frameW || 64))),
    rows: Math.max(1, Math.floor(height / (currentGrid.frameH || 64))),
    score: -1
  };

  for (const size of candidates) {
    const cols = Math.floor(width / size);
    const rows = Math.floor(height / size);
    if (cols && rows && width % size === 0 && height % size === 0) {
      const score = (size === 64 ? 200 : 0) + cols + rows;
      if (score > best.score) best = { frameW: size, frameH: size, cols, rows, score };
    }
  }

  return best;
}

export function makeDefaultRowLabels(rows, directionLabels = ['up', 'left', 'down', 'right']) {
  return Array.from({ length: rows }, (_, index) => directionLabels[index % directionLabels.length] || `row_${index + 1}`);
}
