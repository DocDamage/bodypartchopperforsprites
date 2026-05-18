import { detectGridFromImageSize, makeDefaultRowLabels } from '../canvas/frame-utils.js';
import { safeName } from '../core/constants.js';

export function buildSourceRecord({ name = '', dataUrl = '', width = 0, height = 0 }) {
  return { name, dataUrl, width, height };
}

export function buildGridForSource({ width, height, currentGrid = {}, rowLabels = null }) {
  const detected = detectGridFromImageSize(width, height, currentGrid);
  const grid = {
    ...currentGrid,
    frameW: detected.frameW,
    frameH: detected.frameH,
    cols: detected.cols,
    rows: detected.rows,
    marginX: currentGrid.marginX || 0,
    marginY: currentGrid.marginY || 0,
    spacingX: currentGrid.spacingX || 0,
    spacingY: currentGrid.spacingY || 0,
    baseName: currentGrid.baseName || 'sprite'
  };

  grid.rowLabels = rowLabels || (Array.isArray(currentGrid.rowLabels) && currentGrid.rowLabels.length === grid.rows
    ? currentGrid.rowLabels
    : makeDefaultRowLabels(grid.rows, currentGrid.directionLabels));

  return grid;
}

export function sourceBaseName(fileName = '') {
  return safeName(String(fileName).replace(/\.[^.]+$/, '') || 'sprite');
}

export function isSupportedImageFileName(fileName = '') {
  return /\.(png|webp|jpe?g)$/i.test(String(fileName));
}

export function isSupportedMetadataFileName(fileName = '') {
  return /\.(json|csv)$/i.test(String(fileName));
}
