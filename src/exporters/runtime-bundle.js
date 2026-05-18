import { APP_VERSION, deepClone } from '../core/constants.js';
import { summarizeDiagnostics } from '../validators/diagnostics.js';

export function buildRuntimeBundle(projectState, options = {}) {
  const state = projectState || {};
  return {
    version: APP_VERSION,
    generatedAt: options.generatedAt || new Date().toISOString(),
    source: {
      name: state.source?.name || '',
      width: state.source?.width || 0,
      height: state.source?.height || 0
    },
    grid: deepClone(state.grid || {}),
    exportProfile: deepClone(state.profiles?.[state.export?.profileId] || {}),
    frames: deepClone(options.frames || []),
    timeline: deepClone(state.timeline || { clips: [] }),
    pivots: deepClone(state.pivots || []),
    parts: deepClone(state.parts || []),
    atlas: deepClone(state.atlas?.manifest || state.atlas || {}),
    remap: deepClone(state.remap || {}),
    qa: {
      summary: summarizeDiagnostics(state.qa?.diagnostics || []),
      visualDiff: deepClone(state.visualDiff || [])
    }
  };
}
