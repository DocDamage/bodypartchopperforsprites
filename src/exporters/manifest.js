import { APP_VERSION, safeName, deepClone } from '../core/constants.js';
import { frameCell, forEachCell } from '../canvas/frame-utils.js';
import { getProfile, resolveProfilePath } from './profile-defaults.js';

export function buildFramePath({ grid, profiles, exportSettings, row, col }) {
  const profile = getProfile(profiles, exportSettings?.profileId || 'generic');
  const rowLabel = safeName(grid.rowLabels?.[row] || `row_${row + 1}`);
  const colLabel = String(col + 1).padStart(2, '0');
  return resolveProfilePath(profile, {
    base: safeName(grid.baseName || 'sprite'),
    row: rowLabel,
    col: colLabel,
    direction: inferDirection(rowLabel),
    animation: inferAnimation(rowLabel)
  });
}

export function buildFrameManifest({ grid, profiles, exportSettings }) {
  const frames = [];
  forEachCell(grid, (row, col, cell) => {
    frames.push({
      row,
      col,
      label: grid.rowLabels?.[row] || `row_${row + 1}`,
      path: buildFramePath({ grid, profiles, exportSettings, row, col }),
      x: cell.x,
      y: cell.y,
      w: cell.w,
      h: cell.h
    });
  });
  return frames;
}

export function buildAnimationManifest({ grid, anim = {}, timeline = {} }) {
  const defaultFrames = Array.from({ length: grid.cols }, (_, index) => index);
  return {
    fps: anim.fps || 8,
    rows: [...(grid.rowLabels || [])],
    clips: timeline.clips?.length
      ? deepClone(timeline.clips)
      : (grid.rowLabels || []).map((label, row) => ({
          name: label,
          row,
          frames: anim.cycle?.length ? [...anim.cycle] : defaultFrames,
          fps: anim.fps || 8,
          loop: true
        }))
  };
}

export function buildExportPreview({ state, frames = null }) {
  const profile = getProfile(state.profiles, state.export?.profileId || 'generic');
  const frameRecords = frames || buildFrameManifest({ grid: state.grid, profiles: state.profiles, exportSettings: state.export });
  const files = frameRecords.map((frame) => ({
    type: 'frame',
    row: frame.row,
    col: frame.col,
    path: frame.path,
    profile: state.export?.profileId || 'generic'
  }));

  files.push({ type: 'manifest', path: `manifests/${profile.manifest}` });
  files.push({ type: 'project', path: 'project/project.spriteproject.json' });
  files.push({ type: 'qa_report', path: 'reports/qa_report.md' });
  if (state.export?.includeCredits !== false) files.push({ type: 'credits', path: 'credits/CREDITS.md' });

  return {
    version: APP_VERSION,
    profile,
    generatedAt: new Date().toISOString(),
    files
  };
}

export function inferDirection(label = '') {
  const parts = String(label).split('_');
  return parts[parts.length - 1] || '';
}

export function inferAnimation(label = '') {
  const parts = String(label).split('_');
  return parts.length > 1 ? parts.slice(0, -1).join('_') : String(label || '');
}

export function cellForFrame(grid, frame) {
  return frameCell(grid, frame.row, frame.col);
}
