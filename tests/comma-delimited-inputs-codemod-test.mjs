import { fixCommaDelimitedInputs } from '../scripts/fix-comma-delimited-inputs.mjs';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const appFixture = `(() => {
  function wireEvents() {
    const syncInputs = [els.rowLabelsInput, els.directionLabelsInput, els.frameCycleInput];
    syncInputs.forEach(input => input.addEventListener('input', () => { pushHistory(); syncFromInputs(); renderAll(); draw(); }));
  }

  function syncToInputs() {
    els.baseNameInput.value = state.grid.baseName;
    els.rowLabelsInput.value = state.grid.rowLabels.join(',');
    els.directionLabelsInput.value = state.grid.directionLabels.join(',');
    els.fpsInput.value = state.anim.fps;
    els.frameCycleInput.value = state.anim.cycle.join(',');
  }

  function renderAll() { syncToInputs(); renderPreviewRowSelect(); renderTimelineRowSelect(); renderLists(); renderDiagnostics(); renderPalette(); renderProfilePreview(); updateSelectionSummary(); updateQaSummary(); updateSourceLabels(); }
})();`;

const result = fixCommaDelimitedInputs(appFixture);
assert(result.changed === true, 'comma codemod reports app.js changed');
assert(result.output.includes('renderAll({ preserveEditing: true });'), 'input handler preserves active editing');
assert(result.output.includes('function syncToInputs(options = {})'), 'syncToInputs accepts options');
assert(result.output.includes('const active = document.activeElement;'), 'syncToInputs tracks active field');
assert(result.output.includes('active !== els.rowLabelsInput'), 'row labels are not rewritten while active');
assert(result.output.includes('active !== els.directionLabelsInput'), 'direction labels are not rewritten while active');
assert(result.output.includes('active !== els.frameCycleInput'), 'frame cycle is not rewritten while active');
assert(result.output.includes('function renderAll(options = {})'), 'renderAll forwards options');

const secondResult = fixCommaDelimitedInputs(result.output);
assert(secondResult.changed === false, 'comma codemod is idempotent');

if (process.exitCode) process.exit(process.exitCode);
