export function ensurePartTransform(transforms = {}, part) {
  if (!part) return null;
  return transforms[part.id] || { partId: part.id, partName: part.name, rotation: 0, x: 0, y: 0, scale: 1 };
}

export function rotateTransform(transform, degrees) {
  return { ...transform, rotation: (Number(transform.rotation) || 0) + degrees };
}

export function resetTransform(transform) {
  return { ...transform, rotation: 0, x: 0, y: 0, scale: 1 };
}

export function buildPoseSnapshot({ part, transform, name = '', idFactory = defaultIdFactory }) {
  if (!part) throw new Error('Part is required to build a pose snapshot.');
  const poseName = normalizePoseName(name || `${part.name}_pose`);
  return {
    id: idFactory('pose'),
    name: poseName,
    frame: { row: part.row, col: part.col },
    transforms: { [part.id]: { ...transform } }
  };
}

export function normalizePoseName(value) {
  return String(value || 'pose').toLowerCase().replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'pose';
}

function defaultIdFactory(prefix) {
  return prefix + '_test';
}
