import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const OLD_CONTROL_LIST = `    [els.exportProfileSelect, els.recipeProfileSelect, els.partCategoryInput, els.assetCategoryFilter, els.assetSearchInput, els.directionOverrideSelect, els.pluginSearchInput, els.pluginTypeFilter, els.timelineClipName, els.timelineRowSelect, els.timelineFpsInput, els.onionEnabledInput, els.onionPrevInput, els.onionNextInput, els.onionOpacityInput, els.poseNameInput, els.remapLayoutSelect, els.atlasNameInput, els.atlasPaddingInput, els.atlasMaxWidthInput].filter(Boolean).forEach(input => {
      input.addEventListener('input', () => { syncFromInputs(); renderAll(); draw(); });
    });`;

const NEW_CONTROL_LIST = `    [els.exportProfileSelect, els.recipeProfileSelect, els.previewRowSelect, els.partCategoryInput, els.assetCategoryFilter, els.assetSearchInput, els.directionOverrideSelect, els.pluginSearchInput, els.pluginTypeFilter, els.timelineClipName, els.timelineRowSelect, els.timelineFpsInput, els.onionEnabledInput, els.onionPrevInput, els.onionNextInput, els.onionOpacityInput, els.poseNameInput, els.remapLayoutSelect, els.atlasNameInput, els.atlasPaddingInput, els.atlasMaxWidthInput].filter(Boolean).forEach(input => {
      input.addEventListener('input', () => { syncFromInputs(); renderAll(); draw(); });
    });`;

const RENDER_PREVIEW_ROW_SELECT_RE = /  function renderPreviewRowSelect\(\) \{[\s\S]*?els\.previewRowSelect\.value = clamp\(state\.anim\.previewRow,0,state\.grid\.rows-1\); \}/;

const NEW_PREVIEW_RENDER = `  function renderPreviewRowSelect() {
    const selected = clamp(state.anim.previewRow, 0, state.grid.rows - 1);
    const currentOptions = Array.from({ length: state.grid.rows }, (_, i) => {
      const label = state.grid.rowLabels[i] || 'row_' + (i + 1);
      return '<option value="' + i + '">' + i + ': ' + label + '</option>';
    }).join('');
    if (els.previewRowSelect.innerHTML !== currentOptions) els.previewRowSelect.innerHTML = currentOptions;
    els.previewRowSelect.value = selected;
  }`;

export function fixPreviewDirectionSelect(source) {
  let output = source;
  let changed = false;

  if (output.includes(OLD_CONTROL_LIST)) {
    output = output.replace(OLD_CONTROL_LIST, NEW_CONTROL_LIST);
    changed = true;
  } else if (!output.includes('els.previewRowSelect, els.partCategoryInput')) {
    throw new Error('Could not find preview row select listener block or existing preview row listener.');
  }

  if (RENDER_PREVIEW_ROW_SELECT_RE.test(output)) {
    output = output.replace(RENDER_PREVIEW_ROW_SELECT_RE, NEW_PREVIEW_RENDER);
    changed = true;
  } else if (!output.includes('const selected = clamp(state.anim.previewRow')) {
    throw new Error('Could not find renderPreviewRowSelect block or existing fixed render block.');
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
  const results = [applyFile('app.js', fixPreviewDirectionSelect, write)];
  return { changed: results.some((result) => result.changed), results };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  const result = runIntegration({ write });
  for (const item of result.results) console.log(`${item.changed ? 'CHANGED' : 'OK'} ${item.relativePath}`);
  if (!write && result.changed) console.log('\nDry run only. Re-run with --write to update files.');
}
