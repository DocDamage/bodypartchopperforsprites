import { bboxOfPoints, frameCell } from './frame-utils.js';

export function clonePartToFrame(part, sourceGrid, targetRow, targetCol, idFactory = defaultIdFactory) {
  const sourceCell = frameCell(sourceGrid, part.row, part.col);
  const targetCell = frameCell(sourceGrid, targetRow, targetCol);
  const clone = { ...part, id: idFactory('part'), name: `${part.name}_${targetRow}_${targetCol}`, row: targetRow, col: targetCol };

  if (part.type === 'polygon') {
    const localPoints = part.points.map((point) => ({ x: point.x - sourceCell.x, y: point.y - sourceCell.y }));
    clone.points = localPoints.map((point) => ({ x: Math.round(targetCell.x + point.x), y: Math.round(targetCell.y + point.y) }));
    Object.assign(clone, bboxOfPoints(clone.points));
  } else {
    clone.x = Math.round(targetCell.x + (part.x - sourceCell.x));
    clone.y = Math.round(targetCell.y + (part.y - sourceCell.y));
    clone.w = part.w;
    clone.h = part.h;
  }

  return clone;
}

export function mirrorPart(part, grid, idFactory = defaultIdFactory) {
  const cell = frameCell(grid, part.row, part.col);
  const clone = { ...part, id: idFactory('part'), name: `${part.name}_mirrored` };

  if (part.type === 'polygon') {
    clone.points = part.points
      .map((point) => ({ x: Math.round(cell.x + cell.w - (point.x - cell.x)), y: point.y }))
      .reverse();
    Object.assign(clone, bboxOfPoints(clone.points));
  } else {
    clone.x = Math.round(cell.x + cell.w - (part.x - cell.x) - part.w);
  }

  return clone;
}

export function buildHumanoidTemplateParts({ grid, row, col, category = 'other', idFactory = defaultIdFactory }) {
  const cell = frameCell(grid, row, col);
  const specs = [
    ['head', 'heads', 0.34, 0.08, 0.32, 0.22],
    ['torso', 'torsos', 0.30, 0.30, 0.40, 0.28],
    ['arm_left', 'arms', 0.18, 0.32, 0.18, 0.34],
    ['arm_right', 'arms', 0.64, 0.32, 0.18, 0.34],
    ['hands', 'hands', 0.20, 0.62, 0.60, 0.12],
    ['legs_or_skirt', 'legs', 0.32, 0.58, 0.36, 0.28],
    ['feet', 'feet', 0.28, 0.84, 0.44, 0.10]
  ];

  return specs.map(([name, partCategory, rx, ry, rw, rh]) => ({
    id: idFactory('part'),
    type: 'rect',
    name,
    category: partCategory || category,
    row,
    col,
    x: Math.round(cell.x + cell.w * rx),
    y: Math.round(cell.y + cell.h * ry),
    w: Math.round(cell.w * rw),
    h: Math.round(cell.h * rh),
    zOrder: 100,
    visible: true,
    locked: false,
    underlapPadding: 2,
    color: '#7dd3fc'
  }));
}

function defaultIdFactory(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
