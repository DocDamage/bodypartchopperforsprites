import { spawnSync } from 'node:child_process';

const testFiles = [
  'tests/static-smoke-test.mjs',
  'tests/core-module-test.mjs',
  'tests/lab-module-test.mjs',
  'tests/runtime-shell-test.mjs',
  'tests/storage-bridge-test.mjs',
  'tests/library-storage-adapter-test.mjs',
  'tests/library-adapter-codemod-test.mjs',
  'tests/plugin-settings-codemod-test.mjs',
  'tests/save-state-codemod-test.mjs',
  'tests/comma-delimited-inputs-codemod-test.mjs',
  'tests/project-format-codemod-test.mjs',
  'tests/preview-direction-codemod-test.mjs',
  'tests/importer-module-test.mjs'
];

let failed = false;
for (const testFile of testFiles) {
  console.log(`\nRunning ${testFile}`);
  const result = spawnSync(process.execPath, [testFile], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}

if (failed) process.exit(1);
console.log('\nAll tests passed.');