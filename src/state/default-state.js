import { APP_VERSION, DEFAULT_DIRECTIONS, deepClone } from '../core/constants.js';
import { DEFAULT_PROFILES } from '../exporters/profile-defaults.js';
import { DEFAULT_PLUGIN_SETTINGS } from '../plugins/builtin-plugins.js';

export function createDefaultGrid() {
  return {
    cols: 13,
    rows: 4,
    frameW: 64,
    frameH: 64,
    marginX: 0,
    marginY: 0,
    spacingX: 0,
    spacingY: 0,
    rowLabels: [...DEFAULT_DIRECTIONS],
    directionLabels: [...DEFAULT_DIRECTIONS],
    baseName: 'sprite'
  };
}

export function createDefaultProjectState() {
  return {
    version: APP_VERSION,
    source: { name: '', dataUrl: '', width: 0, height: 0, image: null },
    grid: createDefaultGrid(),
    view: { showGrid: true, showNumbers: true, showBboxes: false, showPivots: true, showUnderlap: false, zoom: 2 },
    export: { profileId: 'generic', scale: 1, smoothing: false, folderByRow: true, includeSource: true, includeCredits: true },
    qa: { blockFailures: true, allowWarnings: true, diagnostics: [], lastRun: null },
    anim: { previewRow: 0, fps: 8, playing: false, timer: null, tick: 0, cycle: [] },
    ui: { mode: 'slice', selectedFrame: { row: 0, col: 0 }, selected: { type: null, id: null }, tool: null, drag: null, polygon: [] },
    parts: [],
    pivots: [],
    layers: [],
    library: [],
    recipe: { id: 'new_character', name: 'New Character', base: '', layers: [], palette: '', exportProfile: 'generic', directionOrderOverrides: {}, notes: '' },
    batch: [],
    profiles: deepClone(DEFAULT_PROFILES),
    credits: [],
    palette: [],
    plugins: { enabled: { ...DEFAULT_PLUGIN_SETTINGS } },
    batchLogs: [],
    recentProjects: [],
    migrationReport: [],
    visualDiff: [],
    timeline: { clips: [], selectedClipId: '', onionSkin: { enabled: false, prev: 1, next: 1, opacity: 0.24 } },
    poseLibrary: [],
    posePreview: { transforms: {} },
    remap: { target: 'godot_folders', plan: [] },
    atlas: { name: 'sprite_atlas', padding: 2, maxWidth: 1024, frames: [], manifest: null },
    atlasImport: {
      session: null,
      view: { showMask: false, showBoxes: true, showIgnored: false, showOrigins: true, showLabels: false },
      tool: null,
      selectedObjectIds: [],
      zoom: 2
    },
    runtimeBundle: { lastBuilt: null },
    history: [],
    future: []
  };
}
