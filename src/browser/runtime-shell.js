import { APP_VERSION, PROJECT_FORMAT_VERSION } from '../core/constants.js';
import { createDefaultProjectState } from '../state/default-state.js';
import { PROJECT_SCHEMA } from '../state/project-format.js';
import { BUILTIN_PLUGINS, DEFAULT_PLUGIN_SETTINGS } from '../plugins/builtin-plugins.js';
import { buildStorageStatus, createStorageBridge } from './storage-bridge.js';

export function createRuntimeShell(options = {}) {
  const state = options.state || createDefaultProjectState();
  const storageBridge = options.storageBridge || createStorageBridge({ target: options.target, storage: options.storage });
  const shell = {
    version: APP_VERSION,
    projectFormatVersion: PROJECT_FORMAT_VERSION,
    schema: PROJECT_SCHEMA,
    state,
    plugins: BUILTIN_PLUGINS,
    pluginSettings: { ...DEFAULT_PLUGIN_SETTINGS, ...(options.pluginSettings || {}) },
    storageBridge,
    storageStatus: buildStorageStatus(storageBridge),
    bootedAt: options.bootedAt || new Date().toISOString(),
    legacyRuntime: Boolean(options.legacyRuntime)
  };
  return shell;
}

export function attachRuntimeShell(target = globalThis, shell = createRuntimeShell({ target, legacyRuntime: true })) {
  target.DocSpriteSlicerV7 = shell;
  return shell;
}

export function patchLegacyBrand(documentRef, version = APP_VERSION) {
  if (!documentRef) return false;
  documentRef.title = `Doc Sprite Slicer Studio v${version.split('.')[0]}`;
  const brand = documentRef.querySelector?.('.brand-block strong');
  if (brand) {
    brand.innerHTML = `Doc Sprite Slicer Studio <span>v${version.split('.')[0]}</span>`;
  }
  const subtitle = documentRef.querySelector?.('.brand-block em');
  if (subtitle) {
    subtitle.textContent = 'V7 modular architecture foundation with legacy-safe runtime bridge';
  }
  return true;
}

export function bootRuntimeShell({ target = globalThis, documentRef = target.document, legacyRuntime = true } = {}) {
  const shell = attachRuntimeShell(target, createRuntimeShell({ target, legacyRuntime }));
  patchLegacyBrand(documentRef, shell.version);
  return shell;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    bootRuntimeShell({ target: window, documentRef: window.document, legacyRuntime: true });
  }, { once: true });
}
