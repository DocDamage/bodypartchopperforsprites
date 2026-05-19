import { integrateProjectFormat, integrateStaticSmokeTest } from '../scripts/integrate-project-format.mjs';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const legacySnapshotBlock = `  function projectSnapshot(includeLibrary = false) {
    return {
      type: 'doc_sprite_slicer_studio_project', version: VERSION, projectFormatVersion: 6, savedAt: new Date().toISOString(),
      source: state.export.includeSource ? { name: state.source.name, dataUrl: state.source.dataUrl, width: state.source.width, height: state.source.height } : { name: state.source.name, width: state.source.width, height: state.source.height },
      grid: state.grid, view: state.view, export: state.export, qa: state.qa,
      parts: state.parts, pivots: state.pivots, layers: state.layers,
      library: includeLibrary ? state.library : undefined, includeLibrary,
      recipe: state.recipe, batch: state.batch, batchLogs: state.batchLogs, profiles: state.profiles, credits: state.credits, palette: state.palette, pluginsEnabled: state.plugins.enabled, timeline: state.timeline, poseLibrary: state.poseLibrary, posePreview: state.posePreview, remap: state.remap, atlas: state.atlas, runtimeBundle: state.runtimeBundle, migrationReport: state.migrationReport, schema: PROJECT_SCHEMA_V6
    };
  }`;

const legacyMigrateBlock = `  function migrateProject(project = {}) {
    const report = [];
    state.migrationReport = migrated.migrationReport;
    return migrated;
  }`;

const appFixture = `import { createStorageBridge } from './src/browser/storage-bridge.js';

(() => {
  const PROJECT_SCHEMA_V6 = {
    type:'doc_sprite_slicer_studio_project',
    projectFormatVersion:6,
    required:['version']
  };

${legacySnapshotBlock}

${legacyMigrateBlock}
})();`;

const result = integrateProjectFormat(appFixture);
assert(result.changed === true, 'project format codemod reports app.js changed');
assert(result.output.includes("import { createProjectSnapshot as createV7ProjectSnapshot, migrateProject as migrateV7Project } from './src/state/project-format.js';"), 'codemod adds project format import');
assert(result.output.includes('return createV7ProjectSnapshot(state, { includeLibrary });'), 'codemod replaces projectSnapshot body');
assert(result.output.includes('return migrateV7Project(project);'), 'codemod replaces migrateProject body');
assert(!result.output.includes('PROJECT_SCHEMA_V6'), 'codemod removes legacy schema marker');

const secondResult = integrateProjectFormat(result.output);
assert(secondResult.changed === false, 'project format codemod is idempotent');

const smokeFixture = "assert(app.includes('PROJECT_SCHEMA_V6'), 'app includes v6 schema marker');";
const smokeResult = integrateStaticSmokeTest(smokeFixture);
assert(smokeResult.changed === true, 'static smoke project assertion changes');
assert(smokeResult.output.includes('app uses V7 project snapshot helper'), 'static smoke checks V7 snapshot helper');
assert(smokeResult.output.includes('app uses V7 project migration helper'), 'static smoke checks V7 migration helper');

const secondSmokeResult = integrateStaticSmokeTest(smokeResult.output);
assert(secondSmokeResult.changed === false, 'static smoke codemod is idempotent');

if (process.exitCode) process.exit(process.exitCode);
