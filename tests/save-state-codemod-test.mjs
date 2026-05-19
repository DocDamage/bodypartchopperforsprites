import { integrateSaveStateStorage } from '../scripts/integrate-save-state-storage.mjs';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const appFixture = `(() => {
  const AUTOSAVE_KEY = 'doc_sprite_slicer_studio_v6_autosave';
  const AUTOSAVE_SLOTS_KEY = 'doc_sprite_slicer_studio_v6_autosave_slots';
  const RECENT_PROJECTS_KEY = 'doc_sprite_slicer_studio_v6_recent_projects';
  const v7StorageBridge = createStorageBridge({ target: window });

  function recoverAutosave() {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return toast('No autosave found.', 'warn');
    restoreProject(JSON.parse(raw));
  }

  function saveAutosaveSnapshot() {
    const snap = projectSnapshot(false);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snap));
    const slots = JSON.parse(localStorage.getItem(AUTOSAVE_SLOTS_KEY) || '[]');
    slots.unshift({ id: uid('slot'), savedAt: snap.savedAt, name: state.source.name || state.grid.baseName || state.recipe.id, project: snap });
    localStorage.setItem(AUTOSAVE_SLOTS_KEY, JSON.stringify(slots.slice(0, 5)));
    const recents = JSON.parse(localStorage.getItem(RECENT_PROJECTS_KEY) || '[]');
    recents.unshift({ savedAt: snap.savedAt, source: state.source.name, baseName: state.grid.baseName, recipe: state.recipe.id });
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(recents.slice(0, 10)));
  }

  async function restoreLatestAutosaveSlot() {
    const slots = JSON.parse(localStorage.getItem(AUTOSAVE_SLOTS_KEY) || '[]');
    if (!slots.length) return toast('No autosave slots found.', 'warn');
    await restoreProject(slots[0].project);
    toast(\`Restored autosave slot from \${new Date(slots[0].savedAt).toLocaleString()}.\`, 'ok');
  }

  function clearRecoveryData() {
    if (!confirm('Clear autosave, autosave slots, and recent-project recovery data for this browser? Save your project first.')) return;
    localStorage.removeItem(AUTOSAVE_KEY);
    localStorage.removeItem(AUTOSAVE_SLOTS_KEY);
    localStorage.removeItem(RECENT_PROJECTS_KEY);
    toast('Recovery data cleared.', 'ok');
  }

  function exportRecoveryPackage() {
    const files = [
      { name:'recovery/current_project.spriteproject.json', data:textBytes(pretty(projectSnapshot(true))) },
      { name:'recovery/latest_autosave.json', data:textBytes(localStorage.getItem(AUTOSAVE_KEY) || '{}') },
      { name:'recovery/autosave_slots.json', data:textBytes(localStorage.getItem(AUTOSAVE_SLOTS_KEY) || '[]') },
      { name:'recovery/recent_projects.json', data:textBytes(localStorage.getItem(RECENT_PROJECTS_KEY) || '[]') },
      { name:'plugins/plugin_settings.json', data:textBytes(pretty(state.plugins.enabled)) },
      { name:'plugins/plugin_manifest.json', data:textBytes(pretty(buildPluginManifest())) }
    ];
    downloadBlob(createZip(files), 'doc_sprite_slicer_studio_v6_recovery_package.zip');
  }
})();`;

const result = integrateSaveStateStorage(appFixture);
assert(result.changed === true, 'save-state codemod reports app.js changed');
assert(result.output.includes('v7StorageBridge.readRecoveryState()'), 'codemod uses storage bridge recovery reads');
assert(result.output.includes('v7StorageBridge.saveAutosaveSnapshot(snap, { slotId: uid(\'slot\') })'), 'codemod uses storage bridge autosave writes');
assert(result.output.includes('v7StorageBridge.clearRecoveryState()'), 'codemod uses storage bridge recovery clear');
assert(result.output.includes('pretty(recovery.autosave || {})'), 'codemod exports latest autosave from recovery state');
assert(result.output.includes('pretty(v7StorageBridge.loadPluginSettings())'), 'codemod exports plugin settings from bridge');
assert(!result.output.includes('localStorage.setItem(AUTOSAVE_KEY'), 'codemod removes direct autosave write');
assert(!result.output.includes('localStorage.removeItem(AUTOSAVE_KEY'), 'codemod removes direct autosave clear');

const secondResult = integrateSaveStateStorage(result.output);
assert(secondResult.changed === false, 'save-state codemod is idempotent');

if (process.exitCode) process.exit(process.exitCode);
