export const APP_VERSION = '7.0.0';
export const PROJECT_TYPE = 'doc_sprite_slicer_studio_project';
export const PROJECT_FORMAT_VERSION = 7;

export const STORAGE_KEYS = Object.freeze({
  autosave: 'doc_sprite_slicer_studio_v7_autosave',
  library: 'doc_sprite_slicer_studio_v7_asset_library',
  autosaveSlots: 'doc_sprite_slicer_studio_v7_autosave_slots',
  recentProjects: 'doc_sprite_slicer_studio_v7_recent_projects',
  pluginSettings: 'doc_sprite_slicer_studio_v7_plugin_settings',
  legacyLibraryV4: 'doc_sprite_slicer_studio_v4_asset_library',
  legacyLibraryV5: 'doc_sprite_slicer_studio_v5_asset_library',
  legacyLibraryV6: 'doc_sprite_slicer_studio_v6_asset_library'
});

export const CATEGORIES = Object.freeze([
  'body_base',
  'heads',
  'hair',
  'eyes',
  'torsos',
  'arms',
  'hands',
  'legs',
  'feet',
  'armor',
  'cloaks',
  'weapons',
  'accessories',
  'fx',
  'shadows',
  'other'
]);

export const DEFAULT_DIRECTIONS = Object.freeze(['up', 'left', 'down', 'right']);

export const LPC_ROW_LABELS = Object.freeze([
  'spellcast_up', 'spellcast_left', 'spellcast_down', 'spellcast_right',
  'thrust_up', 'thrust_left', 'thrust_down', 'thrust_right',
  'walk_up', 'walk_left', 'walk_down', 'walk_right',
  'slash_up', 'slash_left', 'slash_down', 'slash_right',
  'shoot_up', 'shoot_left', 'shoot_down', 'shoot_right',
  'hurt',
  'climb',
  'idle_up', 'idle_left', 'idle_down', 'idle_right',
  'jump_up', 'jump_left', 'jump_down', 'jump_right',
  'sit_up', 'sit_left', 'sit_down', 'sit_right',
  'emote_up', 'emote_left', 'emote_down', 'emote_right',
  'run_up', 'run_left', 'run_down', 'run_right',
  'combat_up', 'combat_left', 'combat_down', 'combat_right'
]);

export function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function safeName(value, fallback = 'item') {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || fallback;
}
