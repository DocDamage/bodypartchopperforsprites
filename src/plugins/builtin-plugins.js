export const BUILTIN_PLUGINS = Object.freeze([
  { id: 'importer.generic_spritesheet', type: 'importer', version: '1.0.0', name: 'Generic Spritesheet Importer', description: 'Imports PNG, WebP, or JPEG spritesheets and applies grid detection.' },
  { id: 'importer.asset_pack', type: 'importer', version: '1.0.0', name: 'Asset Pack Importer', description: 'Ingests groups of PNG assets plus optional metadata JSON and credits CSV.' },
  { id: 'importer.atlas', type: 'importer', version: '1.0.0', name: 'Fighting / JRPG Atlas Importer', description: 'Imports irregular sprite atlases, fighting-game sheets, JRPG tiny sheets, and compilation reference sheets with automatic detection and manual correction.' },
  { id: 'exporter.generic_png_json', type: 'exporter', version: '1.0.0', name: 'Generic PNG + JSON Exporter', description: 'Exports sliced PNG frames and a generic manifest.' },
  { id: 'exporter.godot4', type: 'exporter', version: '1.0.0', name: 'Godot 4 Exporter', description: 'Generates Godot-friendly folders, animation JSON, and pivot metadata.' },
  { id: 'exporter.unity2d', type: 'exporter', version: '1.0.0', name: 'Unity 2D Exporter', description: 'Generates Unity-friendly sliced frame structure and normalized pivot hints.' },
  { id: 'exporter.rpgmaker_mz', type: 'exporter', version: '1.0.0', name: 'RPG Maker MZ Exporter', description: 'Packages MZ-style frame naming and import notes.' },
  { id: 'exporter.keter', type: 'exporter', version: '1.0.0', name: 'KeterEngine Exporter', description: 'Builds KeterEngine atlas, animation clip, and pivot manifest data.' },
  { id: 'validator.project_integrity', type: 'validator', version: '1.0.0', name: 'Project Integrity Validator', description: 'Checks schema fields, plugin settings, broken recipes, and missing metadata.' },
  { id: 'validator.visual_diff', type: 'validator', version: '1.0.0', name: 'Visual QA Diff Validator', description: 'Checks center drift, bounding-box drift, and mirror mismatch patterns.' },
  { id: 'validator.export_gate', type: 'validator', version: '1.0.0', name: 'Export Gate Validator', description: 'Blocks exports when failures or disallowed warnings are present.' },
  { id: 'batch.qa_export', type: 'batch', version: '1.0.0', name: 'Batch QA + Export Logger', description: 'Adds structured logs and reports to batch jobs.' },
  { id: 'migration.v1_to_v7', type: 'migration', version: '1.0.0', name: 'Legacy Project Migrator', description: 'Normalizes older project files into the v7 project schema.' },
  { id: 'anim.timeline_lab', type: 'animation', version: '1.0.0', name: 'Timeline Lab', description: 'Creates named clips, onion-skin reviews, and per-frame duration metadata.' },
  { id: 'rig.pose_lab', type: 'rig', version: '1.0.0', name: 'Pose Lab', description: 'Saves deterministic pose tests for rig pivots, seams, and underlap review.' },
  { id: 'exporter.runtime_bundle', type: 'exporter', version: '1.0.0', name: 'Runtime Bundle Exporter', description: 'Builds atlas manifests and runtime bundle JSON for game engines.' },
  { id: 'remapper.sheet_layout', type: 'remapper', version: '1.0.0', name: 'Sheet Remapper', description: 'Generates layout conversion plans for Godot, RPG Maker, LPC, Keter, and generic JSON.' }
]);

export const DEFAULT_PLUGIN_SETTINGS = Object.freeze(
  Object.fromEntries(BUILTIN_PLUGINS.map((plugin) => [plugin.id, true]))
);

export function isKnownPlugin(pluginId) {
  return BUILTIN_PLUGINS.some((plugin) => plugin.id === pluginId);
}

export function isPluginEnabled(settings, pluginId) {
  return settings?.[pluginId] !== false;
}

export function normalizePluginSettings(settings = {}) {
  return { ...DEFAULT_PLUGIN_SETTINGS, ...settings };
}
