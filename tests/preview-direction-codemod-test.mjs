import { fixPreviewDirectionSelect } from '../scripts/fix-preview-direction-select.mjs';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const listenerBlock = `    [els.exportProfileSelect, els.recipeProfileSelect, els.partCategoryInput, els.assetCategoryFilter, els.assetSearchInput, els.directionOverrideSelect, els.pluginSearchInput, els.pluginTypeFilter, els.timelineClipName, els.timelineRowSelect, els.timelineFpsInput, els.onionEnabledInput, els.onionPrevInput, els.onionNextInput, els.onionOpacityInput, els.poseNameInput, els.remapLayoutSelect, els.atlasNameInput, els.atlasPaddingInput, els.atlasMaxWidthInput].filter(Boolean).forEach(input => {
      input.addEventListener('input', () => { syncFromInputs(); renderAll(); draw(); });
    });`;

const renderBlock = "  function renderPreviewRowSelect() { els.previewRowSelect.innerHTML = Array.from({ length: state.grid.rows }, (_, i) => 'option').join(''); els.previewRowSelect.value = clamp(state.anim.previewRow,0,state.grid.rows-1); }";

const appFixture = `(() => {
  function wireEvents() {
${listenerBlock}
  }

${renderBlock}
})();`;

const result = fixPreviewDirectionSelect(appFixture);
assert(result.changed === true, 'preview direction codemod reports app.js changed');
assert(result.output.includes('els.previewRowSelect, els.partCategoryInput'), 'codemod adds preview row select to input listener list');
assert(result.output.includes('const selected = clamp(state.anim.previewRow'), 'codemod updates preview row renderer');
assert(result.output.includes("const label = state.grid.rowLabels[i] || 'row_' + (i + 1);"), 'codemod avoids nested template literal renderer');
assert(result.output.includes('if (els.previewRowSelect.innerHTML !== currentOptions)'), 'codemod avoids unnecessary dropdown rewrite');

const secondResult = fixPreviewDirectionSelect(result.output);
assert(secondResult.changed === false, 'preview direction codemod is idempotent');

if (process.exitCode) process.exit(process.exitCode);
