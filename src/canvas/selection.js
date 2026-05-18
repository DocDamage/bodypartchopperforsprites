import { frameFromPoint } from './frame-utils.js';

export function selectPartAtPoint(parts = [], point) {
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index];
    if (point.x >= part.x && point.x <= part.x + part.w && point.y >= part.y && point.y <= part.y + part.h) {
      return part;
    }
  }
  return null;
}

export function selectPivotAtPoint(pivots = [], point, radius = 8) {
  for (let index = pivots.length - 1; index >= 0; index -= 1) {
    const pivot = pivots[index];
    if (Math.hypot(point.x - pivot.x, point.y - pivot.y) < radius) return pivot;
  }
  return null;
}

export function selectObjectAtPoint({ grid, parts = [], pivots = [], point }) {
  const part = selectPartAtPoint(parts, point);
  if (part) return { type: 'part', id: part.id, object: part };

  const pivot = selectPivotAtPoint(pivots, point);
  if (pivot) return { type: 'pivot', id: pivot.id, object: pivot };

  return { type: 'frame', id: null, frame: frameFromPoint(grid, point), object: null };
}

export function selectionLabel(selection, object) {
  if (!selection?.type || selection.type === 'frame') return 'No selection';
  return `${selection.type}: ${object?.name || object?.id || selection.id}`;
}
