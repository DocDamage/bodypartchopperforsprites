import { safeName } from '../core/constants.js';

export function buildBackupFileName(state, timestamp = new Date().toISOString()) {
  const safeStamp = timestamp.replace(/[:.]/g, '-');
  const base = state?.grid?.baseName || state?.recipe?.id || 'sprite_project';
  return `${safeName(base)}_backup_${safeStamp}.spriteproject.json`;
}

export function buildRecoveryPackageFiles({ currentProject, recoveryState, pluginManifest }) {
  return [
    { name: 'recovery/current_project.spriteproject.json', kind: 'json', data: currentProject || {} },
    { name: 'recovery/latest_autosave.json', kind: 'json', data: recoveryState?.autosave || {} },
    { name: 'recovery/autosave_slots.json', kind: 'json', data: recoveryState?.autosaveSlots || [] },
    { name: 'recovery/recent_projects.json', kind: 'json', data: recoveryState?.recentProjects || [] },
    { name: 'plugins/plugin_settings.json', kind: 'json', data: recoveryState?.pluginSettings || {} },
    { name: 'plugins/plugin_manifest.json', kind: 'json', data: pluginManifest || {} }
  ];
}
