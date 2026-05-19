import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const PROJECT_FORMAT_IMPORT = "import { createProjectSnapshot as createV7ProjectSnapshot, migrateProject as migrateV7Project } from './src/state/project-format.js';";

const LEGACY_SCHEMA_BLOCK = `
  const PROJECT_SCHEMA_V6 = {
    type:'doc_sprite_slicer_studio_project',
    projectFormatVersion:6,
    required:['version','source','grid','export','qa','parts','pivots','library','recipe','batch','profiles','pluginsEnabled','timeline','poseLibrary','remap','atlas']
  };
`;

const LEGACY_PROJECT_SNAPSHOT_START = `  function projectSnapshot(includeLibrary = false) {
    return {`;

const LEGACY_PROJECT_SNAPSHOT_END = `      recipe: state.recipe, batch: state.batch, batchLogs: state.batchLogs, profiles: state.profiles, credits: state.credits, palette: state.palette, pluginsEnabled: state.plugins.enabled, timeline: state.timeline, poseLibrary: state.poseLibrary, posePreview: state.posePreview, remap: state.remap, atlas: state.atlas, runtimeBundle: state.runtimeBundle, migrationReport: state.migrationReport, schema: PROJECT_SCHEMA_V6
    };
  }`;

const BRIDGE_PROJECT_SNAPSHOT = `  function projectSnapshot(includeLibrary = false) {
    return createV7ProjectSnapshot(state, { includeLibrary });
  }`;

const LEGACY_MIGRATE_START = `  function migrateProject(project = {}) {
    const report = [];`;

const LEGACY_MIGRATE_END = `    state.migrationReport = migrated.migrationReport;
    return migrated;
  }`;

const BRIDGE_MIGRATE = `  function migrateProject(project = {}) {
    return migrateV7Project(project);
  }`;

export function integrateProjectFormat(source) {
  let output = source;
  let changed = false;

  if (!output.includes(PROJECT_FORMAT_IMPORT)) {
    const importPattern = /import \{ createStorageBridge \} from '\.\/src\/browser\/storage-bridge\.js';/;
    if (!importPattern.test(output)) throw new Error('Could not find storage bridge import in app.js. Run earlier V7 storage codemods first.');
    output = output.replace(importPattern, (match) => `${match}\n${PROJECT_FORMAT_IMPORT}`);
    changed = true;
  }

  if (output.includes(LEGACY_SCHEMA_BLOCK)) {
    output = output.replace(LEGACY_SCHEMA_BLOCK, '\n');
    changed = true;
  }

  if (output.includes(LEGACY_PROJECT_SNAPSHOT_START) && output.includes(LEGACY_PROJECT_SNAPSHOT_END)) {
    const start = output.indexOf(LEGACY_PROJECT_SNAPSHOT_START);
    const end = output.indexOf(LEGACY_PROJECT_SNAPSHOT_END, start) + LEGACY_PROJECT_SNAPSHOT_END.length;
    output = `${output.slice(0, start)}${BRIDGE_PROJECT_SNAPSHOT}${output.slice(end)}`;
    changed = true;
  } else if (!output.includes('createV7ProjectSnapshot(state, { includeLibrary })')) {
    throw new Error('Could not find legacy projectSnapshot block or existing V7 project snapshot call in app.js.');
  }

  if (output.includes(LEGACY_MIGRATE_START) && output.includes(LEGACY_MIGRATE_END)) {
    const start = output.indexOf(LEGACY_MIGRATE_START);
    const end = output.indexOf(LEGACY_MIGRATE_END, start) + LEGACY_MIGRATE_END.length;
    output = `${output.slice(0, start)}${BRIDGE_MIGRATE}${output.slice(end)}`;
    changed = true;
  } else if (!output.includes('return migrateV7Project(project);')) {
    throw new Error('Could not find legacy migrateProject block or existing V7 migration call in app.js.');
  }

  return { output, changed };
}

export function integrateStaticSmokeTest(source) {
  let output = source;
  let changed = false;

  const oldSchemaAssert = "assert(app.includes('PROJECT_SCHEMA_V6'), 'app includes v6 schema marker');";
  const newSchemaAssert = "assert(app.includes('createV7ProjectSnapshot'), 'app uses V7 project snapshot helper');\nassert(app.includes('migrateV7Project'), 'app uses V7 project migration helper');";
  if (output.includes(oldSchemaAssert)) {
    output = output.replace(oldSchemaAssert, newSchemaAssert);
    changed = true;
  } else if (!output.includes("app uses V7 project snapshot helper")) {
    throw new Error('Could not find static smoke project schema assertion.');
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
  const results = [
    applyFile('app.js', integrateProjectFormat, write),
    applyFile('tests/static-smoke-test.mjs', integrateStaticSmokeTest, write)
  ];
  return { changed: results.some((result) => result.changed), results };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  const result = runIntegration({ write });
  for (const item of result.results) console.log(`${item.changed ? 'CHANGED' : 'OK'} ${item.relativePath}`);
  if (!write && result.changed) console.log('\nDry run only. Re-run with --write to update files.');
}
