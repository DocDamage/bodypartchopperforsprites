import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const OLD_SYNC_INPUT_HANDLER = `    syncInputs.forEach(input => input.addEventListener('input', () => { pushHistory(); syncFromInputs(); renderAll(); draw(); }));`;

const NEW_SYNC_INPUT_HANDLER = `    syncInputs.forEach(input => input.addEventListener('input', () => {
      pushHistory();
      syncFromInputs();
      renderAll({ preserveEditing: true });
      draw();
    }));`;

const OLD_SYNC_TO_INPUTS_SIGNATURE = `  function syncToInputs() {`;
const NEW_SYNC_TO_INPUTS_SIGNATURE = `  function syncToInputs(options = {}) {
    const preserveEditing = options.preserveEditing === true;
    const active = document.activeElement;`;

const OLD_ROW_LABEL_SYNC = `    els.rowLabelsInput.value = state.grid.rowLabels.join(',');
    els.directionLabelsInput.value = state.grid.directionLabels.join(',');`;

const NEW_ROW_LABEL_SYNC = `    if (!preserveEditing || active !== els.rowLabelsInput) els.rowLabelsInput.value = state.grid.rowLabels.join(',');
    if (!preserveEditing || active !== els.directionLabelsInput) els.directionLabelsInput.value = state.grid.directionLabels.join(',');`;

const OLD_FRAME_CYCLE_SYNC = `    els.frameCycleInput.value = state.anim.cycle.join(',');`;
const NEW_FRAME_CYCLE_SYNC = `    if (!preserveEditing || active !== els.frameCycleInput) els.frameCycleInput.value = state.anim.cycle.join(',');`;

const OLD_RENDER_ALL = `  function renderAll() { syncToInputs(); renderPreviewRowSelect(); renderTimelineRowSelect(); renderLists(); renderDiagnostics(); renderPalette(); renderProfilePreview(); updateSelectionSummary(); updateQaSummary(); updateSourceLabels(); }`;

const NEW_RENDER_ALL = `  function renderAll(options = {}) {
    syncToInputs(options);
    renderPreviewRowSelect();
    renderTimelineRowSelect();
    renderLists();
    renderDiagnostics();
    renderPalette();
    renderProfilePreview();
    updateSelectionSummary();
    updateQaSummary();
    updateSourceLabels();
  }`;

export function fixCommaDelimitedInputs(source) {
  let output = source;
  let changed = false;

  const replacements = [
    [OLD_SYNC_INPUT_HANDLER, NEW_SYNC_INPUT_HANDLER],
    [OLD_SYNC_TO_INPUTS_SIGNATURE, NEW_SYNC_TO_INPUTS_SIGNATURE],
    [OLD_ROW_LABEL_SYNC, NEW_ROW_LABEL_SYNC],
    [OLD_FRAME_CYCLE_SYNC, NEW_FRAME_CYCLE_SYNC],
    [OLD_RENDER_ALL, NEW_RENDER_ALL]
  ];

  for (const [oldText, newText] of replacements) {
    if (output.includes(oldText)) {
      output = output.replace(oldText, newText);
      changed = true;
    } else if (!output.includes(newText)) {
      throw new Error(`Could not find expected comma-field migration block: ${oldText.slice(0, 80)}`);
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
  const results = [applyFile('app.js', fixCommaDelimitedInputs, write)];
  return { changed: results.some((result) => result.changed), results };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  const result = runIntegration({ write });
  for (const item of result.results) console.log(`${item.changed ? 'CHANGED' : 'OK'} ${item.relativePath}`);
  if (!write && result.changed) console.log('\nDry run only. Re-run with --write to update files.');
}
