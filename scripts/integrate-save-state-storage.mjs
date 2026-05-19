import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const LEGACY_RECOVER_AUTOSAVE = `  function recoverAutosave() {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return toast('No autosave found.', 'warn');
    restoreProject(JSON.parse(raw));
  }`;

const BRIDGE_RECOVER_AUTOSAVE = `  function recoverAutosave() {
    const recovery = v7StorageBridge.readRecoveryState();
    if (!recovery.autosave) return toast('No autosave found.', 'warn');
    restoreProject(recovery.autosave);
  }`;

const LEGACY_SAVE_SNAPSHOT = `  function saveAutosaveSnapshot() {
    const snap = projectSnapshot(false);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snap));
    const slots = JSON.parse(localStorage.getItem(AUTOSAVE_SLOTS_KEY) || '[]');
    slots.unshift({ id: uid('slot'), savedAt: snap.savedAt, name: state.source.name || state.grid.baseName || state.recipe.id, project: snap });
    localStorage.setItem(AUTOSAVE_SLOTS_KEY, JSON.stringify(slots.slice(0, 5)));
    const recents = JSON.parse(localStorage.getItem(RECENT_PROJECTS_KEY) || '[]');
    recents.unshift({ savedAt: snap.savedAt, source: state.source.name, baseName: state.grid.baseName, recipe: state.recipe.id });
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(recents.slice(0, 10)));
  }`;

const BRIDGE_SAVE_SNAPSHOT = `  function saveAutosaveSnapshot() {
    const snap = projectSnapshot(false);
    return v7StorageBridge.saveAutosaveSnapshot(snap, { slotId: uid('slot') });
  }`;

const LEGACY_RESTORE_SLOT = `  async function restoreLatestAutosaveSlot() {
    const slots = JSON.parse(localStorage.getItem(AUTOSAVE_SLOTS_KEY) || '[]');
    if (!slots.length) return toast('No autosave slots found.', 'warn');
    await restoreProject(slots[0].project);
    toast(\`Restored autosave slot from \${new Date(slots[0].savedAt).toLocaleString()}.\`, 'ok');
  }`;

const BRIDGE_RESTORE_SLOT = `  async function restoreLatestAutosaveSlot() {
    const slots = v7StorageBridge.readRecoveryState().autosaveSlots || [];
    if (!slots.length) return toast('No autosave slots found.', 'warn');
    await restoreProject(slots[0].project);
    toast(\`Restored autosave slot from \${new Date(slots[0].savedAt).toLocaleString()}.\`, 'ok');
  }`;

const LEGACY_CLEAR_RECOVERY = `  function clearRecoveryData() {
    if (!confirm('Clear autosave, autosave slots, and recent-project recovery data for this browser? Save your project first.')) return;
    localStorage.removeItem(AUTOSAVE_KEY);
    localStorage.removeItem(AUTOSAVE_SLOTS_KEY);
    localStorage.removeItem(RECENT_PROJECTS_KEY);
    toast('Recovery data cleared.', 'ok');
  }`;

const BRIDGE_CLEAR_RECOVERY = `  function clearRecoveryData() {
    if (!confirm('Clear autosave, autosave slots, and recent-project recovery data for this browser? Save your project first.')) return;
    v7StorageBridge.clearRecoveryState();
    toast('Recovery data cleared.', 'ok');
  }`;

const LEGACY_EXPORT_RECOVERY = `  function exportRecoveryPackage() {
    const files = [
      { name:'recovery/current_project.spriteproject.json', data:textBytes(pretty(projectSnapshot(true))) },
      { name:'recovery/latest_autosave.json', data:textBytes(localStorage.getItem(AUTOSAVE_KEY) || '{}') },
      { name:'recovery/autosave_slots.json', data:textBytes(localStorage.getItem(AUTOSAVE_SLOTS_KEY) || '[]') },
      { name:'recovery/recent_projects.json', data:textBytes(localStorage.getItem(RECENT_PROJECTS_KEY) || '[]') },
      { name:'plugins/plugin_settings.json', data:textBytes(pretty(state.plugins.enabled)) },
      { name:'plugins/plugin_manifest.json', data:textBytes(pretty(buildPluginManifest())) }
    ];
    downloadBlob(createZip(files), 'doc_sprite_slicer_studio_v6_recovery_package.zip');
  }`;

const BRIDGE_EXPORT_RECOVERY = `  function exportRecoveryPackage() {
    const recovery = v7StorageBridge.readRecoveryState();
    const files = [
      { name:'recovery/current_project.spriteproject.json', data:textBytes(pretty(projectSnapshot(true))) },
      { name:'recovery/latest_autosave.json', data:textBytes(pretty(recovery.autosave || {})) },
      { name:'recovery/autosave_slots.json', data:textBytes(pretty(recovery.autosaveSlots || [])) },
      { name:'recovery/recent_projects.json', data:textBytes(pretty(recovery.recentProjects || [])) },
      { name:'plugins/plugin_settings.json', data:textBytes(pretty(v7StorageBridge.loadPluginSettings())) },
      { name:'plugins/plugin_manifest.json', data:textBytes(pretty(buildPluginManifest())) }
    ];
    downloadBlob(createZip(files), 'doc_sprite_slicer_studio_v6_recovery_package.zip');
  }`;

const REPLACEMENTS = [
  [LEGACY_RECOVER_AUTOSAVE, BRIDGE_RECOVER_AUTOSAVE],
  [LEGACY_SAVE_SNAPSHOT, BRIDGE_SAVE_SNAPSHOT],
  [LEGACY_RESTORE_SLOT, BRIDGE_RESTORE_SLOT],
  [LEGACY_CLEAR_RECOVERY, BRIDGE_CLEAR_RECOVERY],
  [LEGACY_EXPORT_RECOVERY, BRIDGE_EXPORT_RECOVERY]
];

export function integrateSaveStateStorage(source) {
  if (!source.includes('const v7StorageBridge = createStorageBridge({ target: window });')) {
    throw new Error('Could not find v7StorageBridge in app.js. Run the plugin settings codemod first.');
  }

  let output = source;
  let changed = false;

  for (const [legacy, bridge] of REPLACEMENTS) {
    if (output.includes(legacy)) {
      output = output.replace(legacy, bridge);
      changed = true;
    } else if (!output.includes(bridge)) {
      throw new Error('Could not find expected legacy block or bridge block in app.js.');
    }
  }

  return { output, changed };
}

function applyFile(relativePath, transformer, write) {
  const filePath = path.join(root, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const result = transformer(source);
  if (write && result.changed) fs.writeFileSync(filePath, result.output);
  return { relativePath, ...result };
}

export function runIntegration({ write = false } = {}) {
  const results = [applyFile('app.js', integrateSaveStateStorage, write)];
  return { changed: results.some((result) => result.changed), results };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  const result = runIntegration({ write });
  for (const item of result.results) console.log(`${item.changed ? 'CHANGED' : 'OK'} ${item.relativePath}`);
  if (!write && result.changed) console.log('\nDry run only. Re-run with --write to update files.');
}
