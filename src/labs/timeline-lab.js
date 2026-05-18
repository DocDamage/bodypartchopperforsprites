export function buildTimelineClipFromRow({ grid, row = 0, name = '', fps = 8, cycle = [], idFactory = defaultIdFactory }) {
  const safeRow = Math.max(0, Math.min(row, (grid.rows || 1) - 1));
  const rowLabel = grid.rowLabels?.[safeRow] || 'row_' + (safeRow + 1);
  const frames = (cycle.length ? cycle : Array.from({ length: grid.cols || 0 }, (_, index) => index)).filter((index) => index >= 0 && index < (grid.cols || 0));
  const safeFps = Math.max(1, Number(fps) || 8);
  return {
    id: idFactory('clip'),
    name: normalizeClipName(name || rowLabel),
    row: safeRow,
    rowLabel,
    frames,
    fps: safeFps,
    loop: true,
    durations: frames.map(() => Math.round(1000 / safeFps))
  };
}

export function buildTimelineManifest({ version, timeline = {}, grid = {} }) {
  return {
    version,
    onionSkin: timeline.onionSkin || { enabled: false, prev: 1, next: 1, opacity: 0.24 },
    clips: timeline.clips || [],
    rows: grid.rowLabels || []
  };
}

export function applyClipToAnimation(anim = {}, clip) {
  if (!clip) return { ...anim };
  return { ...anim, previewRow: clip.row, fps: clip.fps, cycle: [...(clip.frames || [])] };
}

export function toggleOnionSkin(onionSkin = {}) {
  return { enabled: !onionSkin.enabled, prev: onionSkin.prev ?? 1, next: onionSkin.next ?? 1, opacity: onionSkin.opacity ?? 0.24 };
}

export function normalizeClipName(value) {
  return String(value || 'clip').toLowerCase().replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'clip';
}

function defaultIdFactory(prefix) {
  return prefix + '_test';
}
