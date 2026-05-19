import { APP_VERSION, PROJECT_FORMAT_VERSION, PROJECT_TYPE, deepClone } from '../core/constants.js';
import { DEFAULT_PROFILES } from '../exporters/profile-defaults.js';
import { DEFAULT_PLUGIN_SETTINGS, normalizePluginSettings } from '../plugins/builtin-plugins.js';
import { createDefaultProjectState } from './default-state.js';

export const PROJECT_SCHEMA = Object.freeze({
  type: PROJECT_TYPE,
  projectFormatVersion: PROJECT_FORMAT_VERSION,
  required: Object.freeze([
    'version',
    'source',
    'grid',
    'export',
    'qa',
    'parts',
    'pivots',
    'library',
    'recipe',
    'batch',
    'profiles',
    'pluginsEnabled',
    'timeline',
    'poseLibrary',
    'remap',
    'atlas'
  ])
});

export function createProjectSnapshot(state, options = {}) {
  const includeLibrary = Boolean(options.includeLibrary);
  const includeSource = state.export?.includeSource !== false;
  return {
    type: PROJECT_TYPE,
    version: APP_VERSION,
    projectFormatVersion: PROJECT_FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    source: includeSource
      ? { name: state.source?.name || '', dataUrl: state.source?.dataUrl || '', width: state.source?.width || 0, height: state.source?.height || 0 }
      : { name: state.source?.name || '', width: state.source?.width || 0, height: state.source?.height || 0 },
    grid: deepClone(state.grid),
    view: deepClone(state.view),
    export: deepClone(state.export),
    qa: deepClone(state.qa),
    parts: deepClone(state.parts || []),
    pivots: deepClone(state.pivots || []),
    layers: deepClone(state.layers || []),
    library: includeLibrary ? deepClone(state.library || []) : undefined,
    includeLibrary,
    recipe: deepClone(state.recipe),
    batch: deepClone(state.batch || []),
    batchLogs: deepClone(state.batchLogs || []),
    profiles: deepClone(state.profiles || DEFAULT_PROFILES),
    credits: deepClone(state.credits || []),
    palette: deepClone(state.palette || []),
    pluginsEnabled: deepClone(state.plugins?.enabled || DEFAULT_PLUGIN_SETTINGS),
    timeline: deepClone(state.timeline),
    poseLibrary: deepClone(state.poseLibrary || []),
    posePreview: deepClone(state.posePreview || { transforms: {} }),
    remap: deepClone(state.remap),
    atlas: deepClone(state.atlas),
    atlasImport: deepClone(state.atlasImport || { session: null, view: { showMask: false, showBoxes: true, showIgnored: false, showOrigins: true, showLabels: false }, tool: null, selectedObjectIds: [], zoom: 2 }),
    runtimeBundle: deepClone(state.runtimeBundle || { lastBuilt: null }),
    migrationReport: deepClone(state.migrationReport || []),
    schema: PROJECT_SCHEMA
  };
}

export function migrateProject(project = {}) {
  const defaults = createDefaultProjectState();
  const report = [];
  const detectedVersion = Number(project.projectFormatVersion || String(project.version || '').match(/^(\d+)/)?.[1] || 1);

  if (detectedVersion < PROJECT_FORMAT_VERSION) {
    report.push(`Migrated project from v${detectedVersion || 'unknown'} to v${PROJECT_FORMAT_VERSION} schema.`);
  }

  const migrated = {
    ...deepClone(project),
    type: PROJECT_TYPE,
    version: APP_VERSION,
    projectFormatVersion: PROJECT_FORMAT_VERSION
  };

  migrated.grid = { ...defaults.grid, ...(project.grid || {}) };
  migrated.view = { ...defaults.view, ...(project.view || {}) };
  migrated.export = { ...defaults.export, ...(project.export || {}) };
  migrated.qa = { ...defaults.qa, ...(project.qa || {}) };
  migrated.parts = Array.isArray(project.parts) ? project.parts : [];
  migrated.pivots = Array.isArray(project.pivots) ? project.pivots : [];
  migrated.layers = Array.isArray(project.layers) ? project.layers : [];
  migrated.library = Array.isArray(project.library) ? project.library : [];
  migrated.recipe = { ...defaults.recipe, ...(project.recipe || {}) };
  migrated.batch = Array.isArray(project.batch) ? project.batch : [];
  migrated.batchLogs = Array.isArray(project.batchLogs) ? project.batchLogs : [];
  migrated.profiles = { ...DEFAULT_PROFILES, ...(project.profiles || {}) };
  migrated.credits = Array.isArray(project.credits) ? project.credits : [];
  migrated.palette = Array.isArray(project.palette) ? project.palette : [];
  migrated.pluginsEnabled = normalizePluginSettings(project.pluginsEnabled || project.plugins?.enabled || {});
  migrated.timeline = { ...defaults.timeline, ...(project.timeline || {}) };
  migrated.poseLibrary = Array.isArray(project.poseLibrary) ? project.poseLibrary : [];
  migrated.posePreview = project.posePreview || { transforms: {} };
  migrated.remap = { ...defaults.remap, ...(project.remap || {}) };
  migrated.atlas = { ...defaults.atlas, ...(project.atlas || {}) };
  migrated.atlasImport = { ...defaults.atlasImport, ...(project.atlasImport || {}) };
  migrated.runtimeBundle = project.runtimeBundle || { lastBuilt: null };
  migrated.migrationReport = [...(project.migrationReport || []), ...report];
  migrated.schema = PROJECT_SCHEMA;

  return migrated;
}
