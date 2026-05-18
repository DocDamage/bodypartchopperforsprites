import { APP_VERSION } from '../core/constants.js';
import { DEFAULT_PROFILES } from '../exporters/profile-defaults.js';
import { BUILTIN_PLUGINS } from '../plugins/builtin-plugins.js';
import { createDiagnostic } from './diagnostics.js';

export function validateProjectIntegrity(state = {}, options = {}) {
  const diagnostics = [];
  const source = options.source || 'project_integrity';
  const add = (severity, title, message) => diagnostics.push(createDiagnostic(severity, title, message, { source }));

  if (!state.version || state.version !== APP_VERSION) {
    add('warning', 'Project runtime version mismatch', `Runtime is ${APP_VERSION}; project state reports ${state.version || 'unknown'}.`);
  }

  if (!state.grid || !state.grid.frameW || !state.grid.frameH) {
    add('fail', 'Invalid grid settings', 'Frame width and height are required for slicing and export.');
  }

  const profiles = { ...DEFAULT_PROFILES, ...(state.profiles || {}) };
  const activeProfile = state.export?.profileId || 'generic';
  if (!profiles[activeProfile]) {
    add('fail', 'Missing export profile', `Active profile ${activeProfile} is not defined.`);
  }

  const library = state.library || [];
  const recipeLayers = state.recipe?.layers || [];
  const brokenRecipeLayers = recipeLayers.filter((layer) => !library.find((asset) => asset.id === layer.assetId));
  if (brokenRecipeLayers.length) {
    add('fail', 'Broken recipe layers', `${brokenRecipeLayers.length} recipe layer(s) point to missing assets.`);
  }

  const pluginSettings = state.plugins?.enabled || state.pluginsEnabled || {};
  const knownPluginIds = new Set(BUILTIN_PLUGINS.map((plugin) => plugin.id));
  const unknownPluginIds = Object.keys(pluginSettings).filter((pluginId) => !knownPluginIds.has(pluginId));
  if (unknownPluginIds.length) {
    add('warning', 'Unknown plugin settings', `${unknownPluginIds.length} plugin setting(s) do not match built-in plugins and will be ignored.`);
  }

  if (!state.source?.dataUrl && !library.length) {
    add('warning', 'No source or library assets', 'Import a spritesheet or asset pack before production export.');
  }

  const missingLicense = recipeLayers
    .map((layer) => library.find((asset) => asset.id === layer.assetId))
    .filter((asset) => asset && !asset.license);
  if (missingLicense.length) {
    add('warning', 'Missing license metadata', `${missingLicense.length} recipe asset(s) need license or credit metadata.`);
  }

  if (!diagnostics.length) {
    add('pass', 'Project integrity passed', 'Schema, plugins, profiles, recipe links, and library basics are valid.');
  }

  return diagnostics;
}
