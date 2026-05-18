import { buildFrameManifest } from '../exporters/manifest.js';
import { safeName } from '../core/constants.js';

export function remapPath(target, frame, baseName = 'sprite') {
  const base = safeName(baseName);
  const row = safeName(frame.label || `row_${frame.row + 1}`);
  const col = String(frame.col + 1).padStart(2, '0');
  if (target === 'godot_folders') return `godot/${row}/${row}_${col}.png`;
  if (target === 'rpg_maker_mz') return `rpg_maker_mz/${base}_${String(frame.row + 1).padStart(2, '0')}_${col}.png`;
  if (target === 'lpc_idle_4dir') return `lpc_idle/${row}/${row}_${col}.png`;
  if (target === 'keter_runtime') return `keter/animations/${row}/${base}_${row}_${col}.png`;
  return `frames/${row}/${base}_${row}_${col}.png`;
}

export function buildRemapPlan({ state, target = 'godot_folders' }) {
  const frames = buildFrameManifest({ grid: state.grid, profiles: state.profiles, exportSettings: state.export });
  return frames.map((frame) => ({ ...frame, targetLayout: target, targetPath: remapPath(target, frame, state.grid?.baseName || 'sprite') }));
}
