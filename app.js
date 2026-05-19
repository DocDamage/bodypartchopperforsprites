import {
  APP_VERSION,
  CATEGORIES as CORE_CATEGORIES,
  LPC_ROW_LABELS as CORE_LPC_ROW_LABELS,
  safeName as coreSafeName
} from './src/core/constants.js';
import { createLibraryStorageAdapter } from './src/browser/library-storage-adapter.js';
import { createStorageBridge } from './src/browser/storage-bridge.js';
import { createProjectSnapshot as createV7ProjectSnapshot, migrateProject as migrateV7Project } from './src/state/project-format.js';

(() => {
  'use strict';

  const VERSION = APP_VERSION;
  const AUTOSAVE_KEY = 'doc_sprite_slicer_studio_v6_autosave';
  const LIBRARY_KEY = 'doc_sprite_slicer_studio_v6_asset_library';
  const AUTOSAVE_SLOTS_KEY = 'doc_sprite_slicer_studio_v6_autosave_slots';
  const RECENT_PROJECTS_KEY = 'doc_sprite_slicer_studio_v6_recent_projects';
  const PLUGIN_SETTINGS_KEY = 'doc_sprite_slicer_studio_v6_plugin_settings';
  const V4_LIBRARY_KEY = 'doc_sprite_slicer_studio_v4_asset_library';
  const V5_LIBRARY_KEY = 'doc_sprite_slicer_studio_v5_asset_library';

  const CATEGORIES = CORE_CATEGORIES;
  const LPC_ROW_LABELS = CORE_LPC_ROW_LABELS;

  const libraryStorageAdapter = createLibraryStorageAdapter({ target: window });
  const v7StorageBridge = createStorageBridge({ target: window });

  const DEFAULT_PROFILES = {
    generic: {
      id: 'generic', name: 'Generic PNG + JSON', folder: 'frames/{row}', file: '{base}_{row}_{col}', manifest: 'manifest.json', pivotFormat: 'generic', scale: 1, folderByRow: true
    },
    godot4: {
      id: 'godot4', name: 'Godot 4 AnimatedSprite2D', folder: 'godot/animations/{row}', file: '{row}_{col}', manifest: 'godot_animations.json', pivotFormat: 'godot', scale: 1, folderByRow: true
    },
    unity2d: {
      id: 'unity2d', name: 'Unity 2D', folder: 'unity/sprites/{row}', file: '{base}_{row}_{col}', manifest: 'unity_sprite_manifest.json', pivotFormat: 'normalized', scale: 1, folderByRow: true
    },
    rpgmz: {
      id: 'rpgmz', name: 'RPG Maker MZ', folder: 'rpgmaker_mz/{row}', file: '{base}_{row}_{col}', manifest: 'rpgmaker_mz_notes.json', pivotFormat: 'none', scale: 1, folderByRow: true
    },
    keter: {
      id: 'keter', name: 'KeterEngine JSON', folder: 'keter/frames/{row}', file: '{base}_{row}_{col}', manifest: 'keter_atlas.json', pivotFormat: 'pixels', scale: 1, folderByRow: true
    },
    lpc: {
      id: 'lpc', name: 'Universal LPC Style', folder: 'lpc/{row}', file: '{row}_{col}', manifest: 'lpc_layer_manifest.json', pivotFormat: 'pixels', scale: 1, folderByRow: true
    }
  };

  const BUILTIN_PLUGINS = [
    { id:'importer.generic_spritesheet', type:'importer', version:'1.0.0', name:'Generic Spritesheet Importer', description:'Imports PNG, WebP, or JPEG spritesheets and applies grid detection.' },
    { id:'importer.asset_pack', type:'importer', version:'1.0.0', name:'Asset Pack Importer', description:'Ingests groups of PNG assets plus optional metadata JSON and credits CSV.' },
    { id:'exporter.generic_png_json', type:'exporter', version:'1.0.0', name:'Generic PNG + JSON Exporter', description:'Exports sliced PNG frames and a generic manifest.' },
    { id:'exporter.godot4', type:'exporter', version:'1.0.0', name:'Godot 4 Exporter', description:'Generates Godot-friendly folders, animation JSON, and pivot metadata.' },
    { id:'exporter.unity2d', type:'exporter', version:'1.0.0', name:'Unity 2D Exporter', description:'Generates Unity-friendly sliced frame structure and normalized pivot hints.' },
    { id:'exporter.rpgmaker_mz', type:'exporter', version:'1.0.0', name:'RPG Maker MZ Exporter', description:'Packages MZ-style frame naming and import notes.' },
    { id:'exporter.keter', type:'exporter', version:'1.0.0', name:'KeterEngine Exporter', description:'Builds KeterEngine atlas, animation clip, and pivot manifest data.' },
    { id:'validator.project_integrity', type:'validator', version:'1.0.0', name:'Project Integrity Validator', description:'Checks schema fields, plugin settings, broken recipes, and missing metadata.' },
    { id:'validator.visual_diff', type:'validator', version:'1.0.0', name:'Visual QA Diff Validator', description:'Checks center drift, bounding-box drift, and mirror mismatch patterns.' },
    { id:'validator.export_gate', type:'validator', version:'1.0.0', name:'Export Gate Validator', description:'Blocks exports when failures or disallowed warnings are present.' },
    { id:'batch.qa_export', type:'batch', version:'1.0.0', name:'Batch QA + Export Logger', description:'Adds structured logs and reports to batch jobs.' },
    { id:'migration.v1_to_v6', type:'migration', version:'1.0.0', name:'Legacy Project Migrator', description:'Normalizes older project files into the v6 project schema.' },
    { id:'anim.timeline_lab', type:'animation', version:'1.0.0', name:'Timeline Lab', description:'Creates named clips, onion-skin reviews, and per-frame duration metadata.' },
    { id:'rig.pose_lab', type:'rig', version:'1.0.0', name:'Pose Lab', description:'Saves deterministic pose tests for rig pivots, seams, and underlap review.' },
    { id:'exporter.runtime_bundle', type:'exporter', version:'1.0.0', name:'Runtime Bundle Exporter', description:'Builds atlas manifests and runtime_bundle_v6.json for game engines.' },
    { id:'remapper.sheet_layout', type:'remapper', version:'1.0.0', name:'Sheet Remapper', description:'Generates layout conversion plans for Godot, RPG Maker, LPC, Keter, and generic JSON.' }
  ];

  const DEFAULT_PLUGIN_SETTINGS = Object.fromEntries(BUILTIN_PLUGINS.map(p => [p.id, true]));


  const state = {
    version: VERSION,
    source: { name: '', dataUrl: '', width: 0, height: 0, image: null },
    grid: { cols: 13, rows: 4, frameW: 64, frameH: 64, marginX: 0, marginY: 0, spacingX: 0, spacingY: 0, rowLabels: ['up','left','down','right'], directionLabels: ['up','left','down','right'], baseName: 'sprite' },
    view: { showGrid: true, showNumbers: true, showBboxes: false, showPivots: true, showUnderlap: false, zoom: 2 },
    export: { profileId: 'generic', scale: 1, smoothing: false, folderByRow: true, includeSource: true, includeCredits: true },
    qa: { blockFailures: true, allowWarnings: true, diagnostics: [], lastRun: null },
    anim: { previewRow: 0, fps: 8, playing: false, timer: null, tick: 0, cycle: [] },
    ui: { mode: 'slice', selectedFrame: { row: 0, col: 0 }, selected: { type: null, id: null }, tool: null, drag: null, polygon: [] },
    parts: [],
    pivots: [],
    layers: [],
    library: [],
    recipe: { id: 'new_character', name: 'New Character', base: '', layers: [], palette: '', exportProfile: 'generic', directionOrderOverrides: {}, notes: '' },
    batch: [],
    profiles: JSON.parse(JSON.stringify(DEFAULT_PROFILES)),
    credits: [],
    palette: [],
    plugins: { enabled: { ...DEFAULT_PLUGIN_SETTINGS } },
    batchLogs: [],
    recentProjects: [],
    migrationReport: [],
    visualDiff: [],
    timeline: { clips: [], selectedClipId: '', onionSkin: { enabled: false, prev: 1, next: 1, opacity: 0.24 } },
    poseLibrary: [],
    posePreview: { transforms: {} },
    remap: { target: 'godot_folders', plan: [] },
    atlas: { name: 'sprite_atlas', padding: 2, maxWidth: 1024, frames: [], manifest: null },
    runtimeBundle: { lastBuilt: null },
    history: [],
    future: []
  };

  const els = {};
  const imageCache = new Map();
  const enc = new TextEncoder();

  function $(sel, root = document) { return root.querySelector(sel); }
  function $$(sel, root = document) { return [...root.querySelectorAll(sel)]; }
  function uid(prefix = 'id') { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  const safeName = coreSafeName;
  function textBytes(s) { return enc.encode(s); }
  function pretty(obj) { return JSON.stringify(obj, null, 2); }

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    bindElements();
    hydrateSelects();
    loadLibraryFromStorage();
    wireEvents();
    syncToInputs();
    renderAll();
    draw();
    autosaveLoop();
    toast('Doc Sprite Slicer Studio v6 ready.', 'ok');
  }

  function bindElements() {
    for (const id of [
      'imageInput','projectInput','assetImageInput','batchInput','libraryImportInput','assetPackInput','tooltip','toastStack','commandPalette','commandSearch','commandResults',
      'sourceName','sourceMeta','dropZone','mainCanvas','canvasStage','emptyHint','inspectorTitle','selectionSummary','statusText','qaSummary','autosaveStatus','contextMenu',
      'colsInput','rowsInput','frameWInput','frameHInput','marginXInput','marginYInput','spacingXInput','spacingYInput','baseNameInput','rowLabelsInput','directionLabelsInput',
      'previewRowSelect','fpsInput','frameCycleInput','previewCanvas','partCategoryInput','underlapPaddingInput','partList','pivotList','directionOverrideSelect','layerList',
      'fromColorInput','toColorInput','paletteSwatches','blockFailuresInput','allowWarningsInput','diagnosticsList','exportProfileSelect','scaleInput','smoothingInput','folderByRowInput','includeSourceInput','includeCreditsInput','profilePreview',
      'assetSearchInput','assetCategoryFilter','assetLibraryList','recipeIdInput','recipeNameInput','recipeProfileSelect','recipeCanvas','recipeLayerList','batchList','batchLogList','pluginSearchInput','pluginTypeFilter','pluginList','timelineClipName','timelineRowSelect','timelineFpsInput','onionEnabledInput','onionPrevInput','onionNextInput','onionOpacityInput','timelineFrameList','timelineClipList','poseNameInput','posePartList','poseList','remapLayoutSelect','remapPreviewList','atlasNameInput','atlasPaddingInput','atlasMaxWidthInput','atlasPreviewList'
    ]) els[id] = document.getElementById(id);
    els.ctx = els.mainCanvas.getContext('2d', { willReadFrequently: true });
    els.previewCtx = els.previewCanvas.getContext('2d');
    els.recipeCtx = els.recipeCanvas.getContext('2d');
  }

  function hydrateSelects() {
    els.partCategoryInput.innerHTML = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
    els.assetCategoryFilter.innerHTML = '<option value="all">all categories</option>' + CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
    renderProfileSelects();
    renderDirectionSelect();
  }

  function renderProfileSelects() {
    const options = Object.values(state.profiles).map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    els.exportProfileSelect.innerHTML = options;
    els.recipeProfileSelect.innerHTML = options;
    els.exportProfileSelect.value = state.export.profileId;
    els.recipeProfileSelect.value = state.recipe.exportProfile;
  }

  function renderDirectionSelect() {
    const dirs = state.grid.directionLabels.length ? state.grid.directionLabels : ['up','left','down','right'];
    els.directionOverrideSelect.innerHTML = dirs.map(d => `<option value="${d}">${d}</option>`).join('');
  }

  function wireEvents() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn) {
        e.preventDefault();
        await runAction(btn.dataset.action, btn);
      }
      if (!e.target.closest('.context-menu')) hideContextMenu();
    });

    $$('.mode-button').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

    const syncInputs = [
      els.colsInput, els.rowsInput, els.frameWInput, els.frameHInput, els.marginXInput, els.marginYInput, els.spacingXInput, els.spacingYInput,
      els.baseNameInput, els.rowLabelsInput, els.directionLabelsInput, els.fpsInput, els.frameCycleInput, els.underlapPaddingInput,
      els.blockFailuresInput, els.allowWarningsInput, els.scaleInput, els.smoothingInput, els.folderByRowInput, els.includeSourceInput, els.includeCreditsInput,
      els.recipeIdInput, els.recipeNameInput
    ];
    syncInputs.forEach(input => input.addEventListener('input', () => {
      pushHistory();
      syncFromInputs();
      renderAll({ preserveEditing: true });
      draw();
    }));
    [els.exportProfileSelect, els.recipeProfileSelect, els.partCategoryInput, els.assetCategoryFilter, els.assetSearchInput, els.directionOverrideSelect, els.pluginSearchInput, els.pluginTypeFilter, els.timelineClipName, els.timelineRowSelect, els.timelineFpsInput, els.onionEnabledInput, els.onionPrevInput, els.onionNextInput, els.onionOpacityInput, els.poseNameInput, els.remapLayoutSelect, els.atlasNameInput, els.atlasPaddingInput, els.atlasMaxWidthInput].filter(Boolean).forEach(input => {
      input.addEventListener('input', () => { syncFromInputs(); renderAll(); draw(); });
    });

    els.imageInput.addEventListener('change', e => loadImageFile(e.target.files[0]));
    els.projectInput.addEventListener('change', async e => loadProjectFile(e.target.files[0]));
    els.assetImageInput.addEventListener('change', e => importAssetImages(e.target.files));
    els.batchInput.addEventListener('change', e => importBatchImages(e.target.files));
    els.libraryImportInput.addEventListener('change', e => importLibraryFile(e.target.files[0]));
    els.assetPackInput.addEventListener('change', e => importAssetPack(e.target.files));

    els.mainCanvas.addEventListener('mousedown', onCanvasDown);
    els.mainCanvas.addEventListener('mousemove', onCanvasMove);
    window.addEventListener('mouseup', onCanvasUp);
    els.mainCanvas.addEventListener('dblclick', onCanvasDoubleClick);
    els.mainCanvas.addEventListener('contextmenu', showCanvasContext);

    els.dropZone.addEventListener('dragover', e => { e.preventDefault(); els.dropZone.classList.add('drag'); });
    els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('drag'));
    els.dropZone.addEventListener('drop', e => { e.preventDefault(); els.dropZone.classList.remove('drag'); loadImageFile(e.dataTransfer.files[0]); });

    document.addEventListener('keydown', async e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); showCommandPalette(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveProject(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); await undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); await redo(); }
      if (e.key === 'Escape') { hideCommandPalette(); hideContextMenu(); cancelTools(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) runAction('deleteSelection'); }
    });
    els.commandSearch.addEventListener('input', () => renderCommands(els.commandSearch.value));
    els.commandSearch.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const first = els.commandResults.querySelector('.command-result');
        if (first) { hideCommandPalette(); runAction(first.dataset.action); }
      }
    });

    document.addEventListener('mouseover', showTooltip);
    document.addEventListener('mousemove', moveTooltip);
    document.addEventListener('mouseout', hideTooltip);

    [els.partList, els.pivotList, els.layerList, els.assetLibraryList, els.recipeLayerList, els.batchList, els.timelineClipList, els.poseList, els.posePartList, els.remapPreviewList, els.atlasPreviewList].filter(Boolean).forEach(list => list.addEventListener('contextmenu', showObjectContext));
  }

  function setMode(mode) {
    state.ui.mode = mode;
    $$('.mode-button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    $$('.panel').forEach(p => p.classList.toggle('active', p.dataset.panel === mode));
    els.inspectorTitle.textContent = modeTitle(mode);
    renderAll();
    draw();
  }

  function modeTitle(mode) {
    return ({ slice:'Slice', animate:'Animate', rig:'Rig Prep', layers:'Layer Stack', palette:'Palette', qa:'QA Gates', export:'Export', library:'Asset Library', recipe:'Recipe Builder', batch:'Batch Queue', plugins:'Plugin Manager', timeline:'Timeline Lab', pose:'Pose Lab', remap:'Sheet Remapper', atlas:'Atlas Lab' })[mode] || mode;
  }

  function syncFromInputs() {
    Object.assign(state.grid, {
      cols: intVal(els.colsInput, 1), rows: intVal(els.rowsInput, 1), frameW: intVal(els.frameWInput, 1), frameH: intVal(els.frameHInput, 1),
      marginX: intVal(els.marginXInput, 0), marginY: intVal(els.marginYInput, 0), spacingX: intVal(els.spacingXInput, 0), spacingY: intVal(els.spacingYInput, 0),
      baseName: els.baseNameInput.value || 'sprite',
      rowLabels: splitLabels(els.rowLabelsInput.value), directionLabels: splitLabels(els.directionLabelsInput.value)
    });
    state.anim.previewRow = Number(els.previewRowSelect.value || 0);
    state.anim.fps = intVal(els.fpsInput, 1);
    state.anim.cycle = splitLabels(els.frameCycleInput.value).map(Number).filter(Number.isFinite);
    state.qa.blockFailures = els.blockFailuresInput.checked;
    state.qa.allowWarnings = els.allowWarningsInput.checked;
    state.export.profileId = els.exportProfileSelect.value || 'generic';
    state.export.scale = intVal(els.scaleInput, 1);
    state.export.smoothing = els.smoothingInput.checked;
    state.export.folderByRow = els.folderByRowInput.checked;
    state.export.includeSource = els.includeSourceInput.checked;
    state.export.includeCredits = els.includeCreditsInput.checked;
    state.recipe.id = safeName(els.recipeIdInput.value || 'new_character');
    state.recipe.name = els.recipeNameInput.value || 'New Character';
    state.recipe.exportProfile = els.recipeProfileSelect.value || state.export.profileId;
    if (els.timelineFpsInput) state.timeline.defaultFps = intVal(els.timelineFpsInput, 1);
    if (els.timelineRowSelect) state.timeline.selectedRow = Number(els.timelineRowSelect.value || state.anim.previewRow || 0);
    if (els.onionEnabledInput) state.timeline.onionSkin.enabled = els.onionEnabledInput.checked;
    if (els.onionPrevInput) state.timeline.onionSkin.prev = intVal(els.onionPrevInput, 0);
    if (els.onionNextInput) state.timeline.onionSkin.next = intVal(els.onionNextInput, 0);
    if (els.onionOpacityInput) state.timeline.onionSkin.opacity = clamp(Number(els.onionOpacityInput.value || .24), 0, 1);
    if (els.remapLayoutSelect) state.remap.target = els.remapLayoutSelect.value || state.remap.target;
    if (els.atlasNameInput) state.atlas.name = safeName(els.atlasNameInput.value || 'sprite_atlas');
    if (els.atlasPaddingInput) state.atlas.padding = intVal(els.atlasPaddingInput, 0);
    if (els.atlasMaxWidthInput) state.atlas.maxWidth = intVal(els.atlasMaxWidthInput, 64);
    renderDirectionSelect();
  }

  function syncToInputs(options = {}) {
    const preserveEditing = options.preserveEditing === true;
    const active = document.activeElement;
    els.colsInput.value = state.grid.cols; els.rowsInput.value = state.grid.rows;
    els.frameWInput.value = state.grid.frameW; els.frameHInput.value = state.grid.frameH;
    els.marginXInput.value = state.grid.marginX; els.marginYInput.value = state.grid.marginY;
    els.spacingXInput.value = state.grid.spacingX; els.spacingYInput.value = state.grid.spacingY;
    els.baseNameInput.value = state.grid.baseName;
    if (!preserveEditing || active !== els.rowLabelsInput) els.rowLabelsInput.value = state.grid.rowLabels.join(',');
    if (!preserveEditing || active !== els.directionLabelsInput) els.directionLabelsInput.value = state.grid.directionLabels.join(',');
    els.fpsInput.value = state.anim.fps;
    if (!preserveEditing || active !== els.frameCycleInput) els.frameCycleInput.value = state.anim.cycle.join(',');
    els.blockFailuresInput.checked = state.qa.blockFailures;
    els.allowWarningsInput.checked = state.qa.allowWarnings;
    els.exportProfileSelect.value = state.export.profileId;
    els.scaleInput.value = state.export.scale;
    els.smoothingInput.checked = state.export.smoothing;
    els.folderByRowInput.checked = state.export.folderByRow;
    els.includeSourceInput.checked = state.export.includeSource;
    els.includeCreditsInput.checked = state.export.includeCredits;
    els.recipeIdInput.value = state.recipe.id;
    els.recipeNameInput.value = state.recipe.name;
    els.recipeProfileSelect.value = state.recipe.exportProfile;
    if (els.timelineFpsInput) els.timelineFpsInput.value = state.timeline.defaultFps || state.anim.fps || 8;
    if (els.onionEnabledInput) els.onionEnabledInput.checked = !!state.timeline.onionSkin.enabled;
    if (els.onionPrevInput) els.onionPrevInput.value = state.timeline.onionSkin.prev ?? 1;
    if (els.onionNextInput) els.onionNextInput.value = state.timeline.onionSkin.next ?? 1;
    if (els.onionOpacityInput) els.onionOpacityInput.value = state.timeline.onionSkin.opacity ?? .24;
    if (els.remapLayoutSelect) els.remapLayoutSelect.value = state.remap.target || 'godot_folders';
    if (els.atlasNameInput) els.atlasNameInput.value = state.atlas.name || 'sprite_atlas';
    if (els.atlasPaddingInput) els.atlasPaddingInput.value = state.atlas.padding ?? 2;
    if (els.atlasMaxWidthInput) els.atlasMaxWidthInput.value = state.atlas.maxWidth ?? 1024;
    renderPreviewRowSelect();
    renderDirectionSelect();
  }

  function intVal(el, min = 0) { return Math.max(min, parseInt(el.value || min, 10) || min); }
  function splitLabels(s) { return String(s || '').split(',').map(v => v.trim()).filter(Boolean); }

  function pushHistory() {
    const last = state.history[state.history.length - 1];
    const snap = JSON.stringify(projectSnapshot(false));
    if (snap !== last) {
      state.history.push(snap);
      if (state.history.length > 60) state.history.shift();
      state.future.length = 0;
    }
  }

  async function undo() {
    if (!state.history.length) return toast('Nothing to undo.', 'warn');
    state.future.push(JSON.stringify(projectSnapshot(false)));
    const snap = state.history.pop();
    await restoreProject(JSON.parse(snap), { quiet: true });
    toast('Undo complete.', 'ok');
  }

  async function redo() {
    if (!state.future.length) return toast('Nothing to redo.', 'warn');
    state.history.push(JSON.stringify(projectSnapshot(false)));
    const snap = state.future.pop();
    await restoreProject(JSON.parse(snap), { quiet: true });
    toast('Redo complete.', 'ok');
  }

  async function runAction(action, sourceEl) {
    const actions = {
      newProject, openImage: () => els.imageInput.click(), openProject: () => els.projectInput.click(), saveProject, recoverAutosave,
      exportWorkspaceZip, exportFramesZip, exportManifest: () => downloadJson('manifest.json', buildManifest()),
      undo, redo, copySettings, pasteSettings, deleteSelection,
      toggleGrid: () => toggle('showGrid'), toggleNumbers: () => toggle('showNumbers'), toggleBboxes: () => toggle('showBboxes'), togglePivots: () => toggle('showPivots'), toggleUnderlap: () => toggle('showUnderlap'),
      zoomIn: () => { state.view.zoom = clamp(state.view.zoom + .5, .5, 8); draw(); }, zoomOut: () => { state.view.zoom = clamp(state.view.zoom - .5, .5, 8); draw(); }, zoomFit,
      detectGrid, applyLpcPreset, applyRpgMzPreset, assignLpcRows, normalizeTransparency,
      addRectPart: () => setTool('rect'), addPolygonPart: () => setTool('polygon'), addHumanoidTemplate, addPivot: () => setTool('pivot'), duplicatePartAllFrames, mirrorParts, saveSelectedPartAsAsset, exportRigLayers,
      playPreview, generateClips, exportAnimationManifest: () => downloadJson('animation_manifest.json', buildAnimationManifest()),
      openAssetImages: () => els.assetImageInput.click(), importLibrary: () => els.libraryImportInput.click(), exportLibrary, exportCredits,
      composeLayers, exportComposedSheet, exportLpcLayerSheets,
      newRecipe, composeRecipe, exportRecipe, exportComposedRecipe,
      openBatchImages: () => els.batchInput.click(), addCurrentToBatch, runBatch, exportBatchPackage,
      runDiagnostics, toggleBlockFailures, toggleAllowWarnings, exportReport,
      setExportGodot: () => setProfile('godot4'), setExportUnity: () => setProfile('unity2d'), setExportRpgMz: () => setProfile('rpgmz'), setExportKeter: () => setProfile('keter'), saveCustomProfile, exportProfiles,
      extractPalette, replaceColor,
      addSelectedAssetToRecipe, duplicateSelectedAsset, deleteSelectedAsset, removeRecipeLayer, moveRecipeLayerUp, moveRecipeLayerDown, duplicateBatchJob, runSelectedBatchJob, toggleBatchJob, showShortcuts, showAbout,
      sliceThisFrame: exportSelectedFrame, setFrameReference: () => toast('Frame set as reference for rig/recipe previews.', 'ok'), saveFrameAsAsset,
      selectAllParts: () => toast('Selection is single-object in v6. Use duplicate/mirror tools on selected parts.', 'warn'),
      showPluginManager, toggleSelectedPlugin, enableAllPlugins, disableAllPlugins, exportPluginManifest, exportPluginReport,
      showTimelineLab, buildTimelineClipFromRow, duplicateTimelineClip, deleteTimelineClip, applyTimelineToAnimation, exportTimelineJson, exportTimelineZip, toggleOnionSkin, showPoseLab, savePose, deletePose, testRotateSelectedPartLeft, testRotateSelectedPartRight, resetPartTransform, exportPoseLibrary, showRemapLab, generateRemapPreview, exportRemapPlan, showAtlasLab, packAtlas, exportAtlasManifest, exportRuntimeBundle, exportRuntimeZip, openAssetPack: () => els.assetPackInput.click(), importAssetPack, validateProject, runVisualDiff, exportVisualDiffReport, exportPreview, backupProject, exportRecoveryPackage, clearRecoveryData, restoreLatestAutosaveSlot, exportFailedBatchOnly
    };
    if (!actions[action]) return toast(`Unknown action: ${action}`, 'warn');
    try {
      const result = actions[action](sourceEl);
      if (result && typeof result.then === 'function') await result;
    } catch (err) {
      console.error(err);
      toast(err.message || String(err), 'fail');
    }
    renderAll();
    draw();
  }

  function toggle(key) { state.view[key] = !state.view[key]; draw(); toast(`${key} ${state.view[key] ? 'on' : 'off'}.`, 'ok'); }

  function newProject() {
    pushHistory();
    const keepLibrary = state.library;
    const keepProfiles = state.profiles;
    Object.assign(state, JSON.parse(JSON.stringify({
      version: VERSION,
      source: { name: '', dataUrl: '', width: 0, height: 0 },
      grid: { cols: 13, rows: 4, frameW: 64, frameH: 64, marginX: 0, marginY: 0, spacingX: 0, spacingY: 0, rowLabels: ['up','left','down','right'], directionLabels: ['up','left','down','right'], baseName: 'sprite' },
      view: state.view,
      export: { profileId: 'generic', scale: 1, smoothing: false, folderByRow: true, includeSource: true, includeCredits: true },
      qa: { blockFailures: true, allowWarnings: true, diagnostics: [], lastRun: null },
      anim: { previewRow: 0, fps: 8, playing: false, timer: null, tick: 0, cycle: [] },
      ui: { mode: 'slice', selectedFrame: { row: 0, col: 0 }, selected: { type: null, id: null }, tool: null, drag: null, polygon: [] },
      parts: [], pivots: [], layers: [], credits: [], palette: [], batch: [], batchLogs: [], visualDiff: [], migrationReport: [], plugins: { enabled: { ...DEFAULT_PLUGIN_SETTINGS } }, timeline: { clips: [], selectedClipId: '', onionSkin: { enabled: false, prev: 1, next: 1, opacity: 0.24 } }, poseLibrary: [], posePreview: { transforms: {} }, remap: { target: 'godot_folders', plan: [] }, atlas: { name: 'sprite_atlas', padding: 2, maxWidth: 1024, frames: [], manifest: null }, runtimeBundle: { lastBuilt: null },
      recipe: { id: 'new_character', name: 'New Character', base: '', layers: [], palette: '', exportProfile: 'generic', directionOrderOverrides: {}, notes: '' }
    })));
    state.source.image = null;
    state.library = keepLibrary;
    state.profiles = keepProfiles;
    syncToInputs();
    setMode('slice');
    toast('New project started.', 'ok');
  }

  async function loadImageFile(file) {
    if (!file) return;
    pushHistory();
    const dataUrl = await fileToDataUrl(file);
    const img = await loadImage(dataUrl);
    state.source = { name: file.name, dataUrl, width: img.naturalWidth, height: img.naturalHeight, image: img };
    state.grid.baseName = safeName(file.name.replace(/\.[^.]+$/, ''));
    detectGrid(false);
    syncToInputs();
    toast(`Loaded ${file.name}.`, 'ok');
  }

  async function loadProjectFile(file) {
    if (!file) return;
    const project = JSON.parse(await file.text());
    await restoreProject(project);
  }

  async function restoreProject(project, opts = {}) {
    project = migrateProject(project);
    const imageData = project.source?.dataUrl || '';
    Object.assign(state.grid, project.grid || {});
    Object.assign(state.view, project.view || {});
    Object.assign(state.export, project.export || {});
    Object.assign(state.qa, project.qa || {});
    state.parts = project.parts || [];
    state.pivots = project.pivots || [];
    state.layers = project.layers || [];
    state.recipe = project.recipe || state.recipe;
    state.batch = project.batch || [];
    state.profiles = { ...DEFAULT_PROFILES, ...(project.profiles || {}) };
    state.credits = project.credits || [];
    state.palette = project.palette || [];
    state.plugins = { enabled: { ...DEFAULT_PLUGIN_SETTINGS, ...(project.pluginsEnabled || project.plugins?.enabled || {}) } };
    state.batchLogs = project.batchLogs || [];
    state.timeline = project.timeline || { clips: [], selectedClipId: '', onionSkin: { enabled: false, prev: 1, next: 1, opacity: 0.24 } };
    state.poseLibrary = project.poseLibrary || [];
    state.posePreview = project.posePreview || { transforms: {} };
    state.remap = project.remap || { target: 'godot_folders', plan: [] };
    state.atlas = project.atlas || { name: 'sprite_atlas', padding: 2, maxWidth: 1024, frames: [], manifest: null };
    state.runtimeBundle = project.runtimeBundle || { lastBuilt: null };
    state.migrationReport = project.migrationReport || state.migrationReport || [];
    savePluginSettings();
    if (project.library && project.includeLibrary) {
      state.library = mergeAssets(state.library, project.library);
      saveLibraryToStorage();
    }
    if (imageData) {
      const img = await loadImage(imageData);
      state.source = { name: project.source?.name || 'restored_source.png', dataUrl: imageData, width: img.naturalWidth, height: img.naturalHeight, image: img };
    } else {
      state.source = { name: '', dataUrl: '', width: 0, height: 0, image: null };
    }
    syncToInputs();
    if (!opts.quiet) toast(`Project restored. Format v${project.version || 'unknown'}.`, 'ok');
  }

  function projectSnapshot(includeLibrary = false) {
    return createV7ProjectSnapshot(state, { includeLibrary });
  }

  function saveProject() {
    const name = `${safeName(state.grid.baseName || state.recipe.id || 'sprite_project')}.spriteproject.json`;
    downloadJson(name, projectSnapshot(false));
    toast('Project downloaded.', 'ok');
  }

  function recoverAutosave() {
    const recovery = v7StorageBridge.readRecoveryState();
    if (!recovery.autosave) return toast('No autosave found.', 'warn');
    restoreProject(recovery.autosave);
  }

  function autosaveLoop() {
    setInterval(() => {
      try {
        saveAutosaveSnapshot();
        els.autosaveStatus.textContent = `Autosaved ${new Date().toLocaleTimeString()}`;
      } catch (err) {
        els.autosaveStatus.textContent = 'Autosave failed';
      }
    }, 60000);
  }

  function detectGrid(showToast = true) {
    if (!state.source.width) return;
    const w = state.source.width, h = state.source.height;
    const candidates = [16, 24, 32, 48, 64, 96, 128, 192];
    let best = { fw: state.grid.frameW, fh: state.grid.frameH, cols: Math.max(1, Math.floor(w / state.grid.frameW)), rows: Math.max(1, Math.floor(h / state.grid.frameH)), score: -1 };
    for (const size of candidates) {
      const cols = Math.floor(w / size), rows = Math.floor(h / size);
      if (cols && rows && w % size === 0 && h % size === 0) {
        const score = (size === 64 ? 10 : 0) + cols + rows;
        if (score > best.score) best = { fw: size, fh: size, cols, rows, score };
      }
    }
    state.grid.frameW = best.fw; state.grid.frameH = best.fh; state.grid.cols = best.cols; state.grid.rows = best.rows;
    if (!state.grid.rowLabels.length || state.grid.rowLabels.length !== state.grid.rows) makeDefaultRowLabels();
    syncToInputs();
    if (showToast) toast(`Detected ${best.cols}×${best.rows} grid at ${best.fw}×${best.fh}.`, 'ok');
  }

  function makeDefaultRowLabels() {
    const dirs = state.grid.directionLabels.length ? state.grid.directionLabels : ['up','left','down','right'];
    state.grid.rowLabels = Array.from({ length: state.grid.rows }, (_, i) => dirs[i % dirs.length] ? `${dirs[i % dirs.length]}` : `row_${i + 1}`);
  }

  function applyLpcPreset() {
    pushHistory();
    state.grid.frameW = 64; state.grid.frameH = 64; state.grid.cols = 13;
    if (state.source.height) state.grid.rows = Math.max(1, Math.floor(state.source.height / 64));
    state.grid.marginX = state.grid.marginY = state.grid.spacingX = state.grid.spacingY = 0;
    state.grid.directionLabels = ['up','left','down','right'];
    assignLpcRows(false);
    syncToInputs();
    toast('Applied LPC-style preset.', 'ok');
  }

  function applyRpgMzPreset() {
    pushHistory();
    state.grid.cols = 12; state.grid.rows = 8;
    if (state.source.width) state.grid.frameW = Math.floor(state.source.width / state.grid.cols);
    if (state.source.height) state.grid.frameH = Math.floor(state.source.height / state.grid.rows);
    state.grid.directionLabels = ['down','left','right','up'];
    state.grid.rowLabels = Array.from({ length: state.grid.rows }, (_, i) => `character_${Math.floor(i / 4) + 1}_${state.grid.directionLabels[i % 4]}`);
    syncToInputs();
    toast('Applied RPG Maker MZ preset.', 'ok');
  }

  function assignLpcRows(showToast = true) {
    state.grid.rowLabels = Array.from({ length: state.grid.rows }, (_, i) => LPC_ROW_LABELS[i] || `lpc_row_${String(i + 1).padStart(2, '0')}`);
    syncToInputs();
    if (showToast) toast('Assigned LPC-style row labels.', 'ok');
  }

  async function normalizeTransparency() {
    if (!state.source.image) return toast('Load a source image first.', 'warn');
    pushHistory();
    const c = document.createElement('canvas'); c.width = state.source.width; c.height = state.source.height;
    const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(state.source.image, 0, 0);
    const img = ctx.getImageData(0,0,c.width,c.height);
    for (let i = 3; i < img.data.length; i += 4) if (img.data[i] < 12) img.data[i] = 0;
    ctx.putImageData(img, 0, 0);
    const dataUrl = c.toDataURL('image/png');
    state.source.dataUrl = dataUrl; state.source.image = await loadImage(dataUrl);
    toast('Near-transparent pixels normalized.', 'ok');
  }

  function draw() {
    const z = state.view.zoom;
    const w = state.source.width || 960, h = state.source.height || 640;
    els.mainCanvas.width = Math.max(320, Math.round(w * z));
    els.mainCanvas.height = Math.max(240, Math.round(h * z));
    els.mainCanvas.style.width = `${els.mainCanvas.width}px`; els.mainCanvas.style.height = `${els.mainCanvas.height}px`;
    const ctx = els.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0,0,els.mainCanvas.width, els.mainCanvas.height);
    ctx.fillStyle = '#0b111c'; ctx.fillRect(0,0,els.mainCanvas.width, els.mainCanvas.height);
    if (!state.source.image) { els.emptyHint.classList.remove('hidden'); updateSourceLabels(); return; }
    els.emptyHint.classList.add('hidden');
    ctx.drawImage(state.source.image, 0, 0, state.source.width * z, state.source.height * z);
    drawOnionSkin(ctx, z);
    if (state.view.showGrid) drawGrid(ctx, z);
    if (state.view.showNumbers) drawFrameNumbers(ctx, z);
    if (state.view.showBboxes) drawBboxes(ctx, z);
    drawSelectedFrame(ctx, z);
    drawParts(ctx, z);
    if (state.view.showPivots) drawPivots(ctx, z);
    drawToolPreview(ctx, z);
    updateSourceLabels();
    drawPreviewFrame();
  }

  function drawGrid(ctx, z) {
    ctx.save(); ctx.strokeStyle = 'rgba(125,211,252,.55)'; ctx.lineWidth = 1;
    for (let c = 0; c <= state.grid.cols; c++) {
      const x = state.grid.marginX + c * (state.grid.frameW + state.grid.spacingX) - state.grid.spacingX;
      ctx.beginPath(); ctx.moveTo(Math.round(x * z) + .5, state.grid.marginY * z); ctx.lineTo(Math.round(x * z) + .5, (state.grid.marginY + state.grid.rows * (state.grid.frameH + state.grid.spacingY)) * z); ctx.stroke();
    }
    for (let r = 0; r <= state.grid.rows; r++) {
      const y = state.grid.marginY + r * (state.grid.frameH + state.grid.spacingY) - state.grid.spacingY;
      ctx.beginPath(); ctx.moveTo(state.grid.marginX * z, Math.round(y * z) + .5); ctx.lineTo((state.grid.marginX + state.grid.cols * (state.grid.frameW + state.grid.spacingX)) * z, Math.round(y * z) + .5); ctx.stroke();
    }
    ctx.restore();
  }

  function drawFrameNumbers(ctx, z) {
    ctx.save(); ctx.font = `${Math.max(9, 9*z)}px sans-serif`; ctx.fillStyle = 'rgba(230,237,243,.88)'; ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.lineWidth = 3;
    forEachCell((r,c,cell) => {
      const label = `${r}:${c}`;
      ctx.strokeText(label, cell.x * z + 4, cell.y * z + 12 * z);
      ctx.fillText(label, cell.x * z + 4, cell.y * z + 12 * z);
    });
    ctx.restore();
  }

  function drawSelectedFrame(ctx, z) {
    const cell = frameCell(state.ui.selectedFrame.row, state.ui.selectedFrame.col);
    ctx.save(); ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2; ctx.strokeRect(cell.x * z + 1, cell.y * z + 1, cell.w * z - 2, cell.h * z - 2); ctx.restore();
  }

  function drawBboxes(ctx, z) {
    ctx.save(); ctx.strokeStyle = 'rgba(52,211,153,.85)'; ctx.lineWidth = 1;
    forEachCell((r,c,cell) => {
      const box = frameBBox(r,c);
      if (!box.empty) ctx.strokeRect((cell.x + box.x) * z, (cell.y + box.y) * z, box.w * z, box.h * z);
    });
    ctx.restore();
  }

  function drawParts(ctx, z) {
    for (const p of state.parts) {
      ctx.save();
      const active = state.ui.selected.type === 'part' && state.ui.selected.id === p.id;
      ctx.strokeStyle = active ? '#fbbf24' : (p.color || '#7dd3fc');
      ctx.fillStyle = active ? 'rgba(251,191,36,.12)' : 'rgba(125,211,252,.10)';
      ctx.lineWidth = active ? 2 : 1;
      if (p.type === 'polygon') {
        ctx.beginPath();
        p.points.forEach((pt, i) => { const x = pt.x*z, y = pt.y*z; if (i) ctx.lineTo(x,y); else ctx.moveTo(x,y); });
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillRect(p.x*z, p.y*z, p.w*z, p.h*z); ctx.strokeRect(p.x*z, p.y*z, p.w*z, p.h*z);
        if (state.view.showUnderlap || active) {
          const pad = p.underlapPadding ?? intVal(els.underlapPaddingInput, 0);
          if (pad) { ctx.setLineDash([4,3]); ctx.strokeStyle = 'rgba(167,139,250,.85)'; ctx.strokeRect((p.x-pad)*z, (p.y-pad)*z, (p.w+pad*2)*z, (p.h+pad*2)*z); }
        }
      }
      ctx.fillStyle = '#fff'; ctx.font = `${Math.max(9, 9*z)}px sans-serif`; ctx.fillText(p.name, p.x*z + 3, p.y*z - 3);
      ctx.restore();
    }
  }

  function drawPivots(ctx, z) {
    ctx.save();
    for (const p of state.pivots) {
      const active = state.ui.selected.type === 'pivot' && state.ui.selected.id === p.id;
      ctx.strokeStyle = active ? '#fbbf24' : '#34d399'; ctx.fillStyle = active ? '#fbbf24' : '#34d399'; ctx.lineWidth = 2;
      const x = p.x*z, y = p.y*z;
      ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x-9,y); ctx.lineTo(x+9,y); ctx.moveTo(x,y-9); ctx.lineTo(x,y+9); ctx.stroke();
      ctx.font = `${Math.max(9, 9*z)}px sans-serif`; ctx.fillText(p.name, x+8, y-8);
    }
    ctx.restore();
  }

  function drawToolPreview(ctx, z) {
    if (state.ui.drag?.type === 'rect') {
      const r = rectFromPoints(state.ui.drag.start, state.ui.drag.current);
      ctx.save(); ctx.setLineDash([5,4]); ctx.strokeStyle = '#fbbf24'; ctx.strokeRect(r.x*z, r.y*z, r.w*z, r.h*z); ctx.restore();
    }
    if (state.ui.tool === 'polygon' && state.ui.polygon.length) {
      ctx.save(); ctx.strokeStyle = '#fbbf24'; ctx.fillStyle = 'rgba(251,191,36,.16)'; ctx.beginPath();
      state.ui.polygon.forEach((pt,i) => i ? ctx.lineTo(pt.x*z,pt.y*z) : ctx.moveTo(pt.x*z,pt.y*z));
      ctx.stroke(); for (const pt of state.ui.polygon) { ctx.beginPath(); ctx.arc(pt.x*z, pt.y*z, 4, 0, Math.PI*2); ctx.fill(); }
      ctx.restore();
    }
  }

  function frameCell(row, col) {
    return { x: state.grid.marginX + col * (state.grid.frameW + state.grid.spacingX), y: state.grid.marginY + row * (state.grid.frameH + state.grid.spacingY), w: state.grid.frameW, h: state.grid.frameH };
  }

  function forEachCell(cb) {
    for (let r=0; r<state.grid.rows; r++) for (let c=0; c<state.grid.cols; c++) cb(r,c,frameCell(r,c));
  }

  function sourcePointFromEvent(e) {
    const rect = els.mainCanvas.getBoundingClientRect();
    return { x: Math.round((e.clientX - rect.left) / state.view.zoom), y: Math.round((e.clientY - rect.top) / state.view.zoom) };
  }

  function frameFromPoint(pt) {
    const col = Math.floor((pt.x - state.grid.marginX) / (state.grid.frameW + state.grid.spacingX));
    const row = Math.floor((pt.y - state.grid.marginY) / (state.grid.frameH + state.grid.spacingY));
    return { row: clamp(row, 0, state.grid.rows - 1), col: clamp(col, 0, state.grid.cols - 1) };
  }

  function onCanvasDown(e) {
    if (!state.source.image) return;
    const pt = sourcePointFromEvent(e);
    const fc = frameFromPoint(pt);
    state.ui.selectedFrame = fc;
    if (state.ui.tool === 'rect') {
      state.ui.drag = { type: 'rect', start: pt, current: pt };
    } else if (state.ui.tool === 'pivot') {
      pushHistory();
      const pivot = { id: uid('pivot'), name: `pivot_${state.pivots.length + 1}`, kind: 'custom', x: pt.x, y: pt.y, row: fc.row, col: fc.col, scope: 'frame' };
      state.pivots.push(pivot); selectObject('pivot', pivot.id); state.ui.tool = null; toast('Pivot placed.', 'ok');
    } else if (state.ui.tool === 'polygon') {
      state.ui.polygon.push(pt);
    } else {
      selectAtPoint(pt);
    }
    draw(); renderAll();
  }

  function onCanvasMove(e) {
    if (state.ui.drag?.type === 'rect') { state.ui.drag.current = sourcePointFromEvent(e); draw(); }
  }

  function onCanvasUp() {
    if (state.ui.drag?.type === 'rect') {
      const r = rectFromPoints(state.ui.drag.start, state.ui.drag.current);
      state.ui.drag = null;
      if (r.w > 2 && r.h > 2) {
        pushHistory();
        const fc = frameFromPoint({ x: r.x + r.w/2, y: r.y + r.h/2 });
        const part = { id: uid('part'), type: 'rect', name: `part_${state.parts.length + 1}`, category: els.partCategoryInput.value || 'other', row: fc.row, col: fc.col, x: r.x, y: r.y, w: r.w, h: r.h, zOrder: 100, visible: true, locked: false, underlapPadding: intVal(els.underlapPaddingInput, 0), color: '#7dd3fc' };
        state.parts.push(part); selectObject('part', part.id); toast('Rect part created.', 'ok');
      }
      draw(); renderAll();
    }
  }

  function onCanvasDoubleClick() { if (state.ui.tool === 'polygon') finishPolygon(); }

  function finishPolygon() {
    if (state.ui.polygon.length < 3) return toast('Polygon needs at least three points.', 'warn');
    pushHistory();
    const box = bboxOfPoints(state.ui.polygon);
    const fc = frameFromPoint({ x: box.x + box.w/2, y: box.y + box.h/2 });
    const part = { id: uid('part'), type: 'polygon', name: `poly_part_${state.parts.length + 1}`, category: els.partCategoryInput.value || 'other', row: fc.row, col: fc.col, x: box.x, y: box.y, w: box.w, h: box.h, points: state.ui.polygon.slice(), zOrder: 100, visible: true, locked: false, underlapPadding: intVal(els.underlapPaddingInput, 0), color: '#a78bfa' };
    state.parts.push(part); state.ui.polygon = []; state.ui.tool = null; selectObject('part', part.id); toast('Polygon part created.', 'ok'); renderAll(); draw();
  }

  function rectFromPoints(a,b) { const x = Math.min(a.x,b.x), y = Math.min(a.y,b.y); return { x, y, w: Math.abs(a.x-b.x), h: Math.abs(a.y-b.y) }; }
  function bboxOfPoints(points) { const xs = points.map(p=>p.x), ys = points.map(p=>p.y); const x = Math.min(...xs), y = Math.min(...ys); return { x, y, w: Math.max(...xs)-x, h: Math.max(...ys)-y }; }

  function selectAtPoint(pt) {
    for (let i=state.parts.length-1; i>=0; i--) {
      const p = state.parts[i];
      if (pt.x >= p.x && pt.x <= p.x+p.w && pt.y >= p.y && pt.y <= p.y+p.h) return selectObject('part', p.id);
    }
    for (let i=state.pivots.length-1; i>=0; i--) {
      const p = state.pivots[i];
      if (Math.hypot(pt.x-p.x, pt.y-p.y) < 8) return selectObject('pivot', p.id);
    }
    state.ui.selected = { type:null, id:null };
  }

  function selectObject(type, id) { state.ui.selected = { type, id }; updateSelectionSummary(); renderLists(); draw(); }
  function updateSelectionSummary() {
    const {type,id} = state.ui.selected;
    let label = 'No selection';
    const obj = getSelectedObject(); if (obj) label = `${type}: ${obj.name || obj.id}`;
    els.selectionSummary.textContent = label;
  }
  function getSelectedObject() {
    const {type,id} = state.ui.selected;
    if (!type || !id) return null;
    if (type === 'part') return state.parts.find(x => x.id === id);
    if (type === 'pivot') return state.pivots.find(x => x.id === id);
    if (type === 'asset') return state.library.find(x => x.id === id);
    if (type === 'recipeLayer') return state.recipe.layers.find(x => x.id === id);
    if (type === 'batch') return state.batch.find(x => x.id === id);
    if (type === 'layer') return state.layers.find(x => x.id === id);
    if (type === 'plugin') return BUILTIN_PLUGINS.find(x => x.id === id);
    return null;
  }

  function setTool(tool) { state.ui.tool = tool; state.ui.polygon = []; toast(`${tool} tool active. Use the canvas; press Esc to cancel.`, 'ok'); }
  function cancelTools() { state.ui.tool = null; state.ui.drag = null; state.ui.polygon = []; draw(); }

  function addHumanoidTemplate() {
    if (!state.source.image) return toast('Load a sheet first.', 'warn');
    pushHistory();
    const cell = frameCell(state.ui.selectedFrame.row, state.ui.selectedFrame.col);
    const fw = cell.w, fh = cell.h, x = cell.x, y = cell.y;
    const specs = [
      ['head','heads', .34,.08,.32,.22], ['torso','torsos', .30,.30,.40,.28],
      ['arm_left','arms', .18,.32,.18,.34], ['arm_right','arms', .64,.32,.18,.34],
      ['hands','hands', .20,.62,.60,.12], ['legs_or_skirt','legs', .32,.58,.36,.28], ['feet','feet', .28,.84,.44,.10]
    ];
    for (const [name,cat,rx,ry,rw,rh] of specs) {
      state.parts.push({ id: uid('part'), type:'rect', name, category:cat, row:state.ui.selectedFrame.row, col:state.ui.selectedFrame.col, x:Math.round(x+fw*rx), y:Math.round(y+fh*ry), w:Math.round(fw*rw), h:Math.round(fh*rh), zOrder:100, visible:true, locked:false, underlapPadding:2, color:'#7dd3fc' });
    }
    toast('Humanoid starter regions added.', 'ok');
  }

  function duplicatePartAllFrames() {
    const part = state.ui.selected.type === 'part' && getSelectedObject();
    if (!part) return toast('Select a part first.', 'warn');
    pushHistory();
    const baseCell = frameCell(part.row, part.col);
    const local = part.type === 'polygon' ? { points: part.points.map(pt => ({ x: pt.x - baseCell.x, y: pt.y - baseCell.y })) } : { x: part.x - baseCell.x, y: part.y - baseCell.y, w: part.w, h: part.h };
    let count = 0;
    forEachCell((r,c,cell) => {
      if (r === part.row && c === part.col) return;
      const clone = { ...part, id: uid('part'), name: `${part.name}_${r}_${c}`, row:r, col:c };
      if (part.type === 'polygon') { clone.points = local.points.map(pt => ({ x: Math.round(cell.x + pt.x), y: Math.round(cell.y + pt.y) })); const box = bboxOfPoints(clone.points); Object.assign(clone, box); }
      else { clone.x = Math.round(cell.x + local.x); clone.y = Math.round(cell.y + local.y); clone.w = local.w; clone.h = local.h; }
      state.parts.push(clone); count++;
    });
    toast(`Duplicated mask to ${count} frames.`, 'ok');
  }

  function mirrorParts() {
    const part = state.ui.selected.type === 'part' && getSelectedObject();
    if (!part) return toast('Select a part first.', 'warn');
    pushHistory();
    const cell = frameCell(part.row, part.col);
    const clone = { ...part, id: uid('part'), name: `${part.name}_mirrored` };
    if (part.type === 'polygon') {
      clone.points = part.points.map(pt => ({ x: Math.round(cell.x + cell.w - (pt.x - cell.x)), y: pt.y })).reverse();
      const box = bboxOfPoints(clone.points); Object.assign(clone, box);
    } else clone.x = Math.round(cell.x + cell.w - (part.x - cell.x) - part.w);
    state.parts.push(clone); selectObject('part', clone.id); toast('Mirrored selected part.', 'ok');
  }

  async function saveSelectedPartAsAsset() {
    const part = state.ui.selected.type === 'part' && getSelectedObject();
    if (!part) return toast('Select a rig part first.', 'warn');
    const dataUrl = await renderPartToDataUrl(part, true);
    const asset = {
      id: uid('asset'), name: part.name, category: part.category || 'other', dataUrl, thumb: dataUrl, frameSize: Math.max(part.w, part.h),
      directions: [state.grid.rowLabels[part.row]?.split('_').pop() || 'unknown'], animations: [state.grid.rowLabels[part.row]?.split('_')[0] || 'unknown'],
      zOrder: part.zOrder || 100, creator: 'DocDamage', license: 'private', sourceUrl: '', notes: `Cut from ${state.source.name || 'source'} frame ${part.row}:${part.col}.`, tags: [part.category || 'other'], createdAt: new Date().toISOString()
    };
    pushHistory(); state.library.push(asset); saveLibraryToStorage(); selectObject('asset', asset.id); setMode('library'); toast(`Saved ${asset.name} to library.`, 'ok');
  }

  async function saveFrameAsAsset() {
    if (!state.source.image) return;
    const { row, col } = state.ui.selectedFrame;
    const dataUrl = await renderFrameToDataUrl(row, col, 1);
    const asset = { id: uid('asset'), name: `frame_${row}_${col}`, category: 'body_base', dataUrl, thumb: dataUrl, frameSize: state.grid.frameW, directions: [state.grid.rowLabels[row] || `row_${row}`], animations: ['frame'], zOrder: 0, creator: 'DocDamage', license: 'private', sourceUrl: '', notes: `Full frame asset from ${state.source.name}.`, tags: ['frame'], createdAt: new Date().toISOString() };
    state.library.push(asset); saveLibraryToStorage(); toast('Frame saved as asset.', 'ok');
  }

  async function renderPartToDataUrl(part, tight = true) {
    const pad = part.underlapPadding ?? intVal(els.underlapPaddingInput, 0);
    const x = Math.max(0, Math.floor(part.x - pad)), y = Math.max(0, Math.floor(part.y - pad));
    const w = Math.ceil(part.w + pad*2), h = Math.ceil(part.h + pad*2);
    const c = document.createElement('canvas'); c.width = tight ? w : state.source.width; c.height = tight ? h : state.source.height;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    if (part.type === 'polygon') {
      ctx.save(); ctx.beginPath(); part.points.forEach((pt,i) => { const px = tight ? pt.x - x : pt.x, py = tight ? pt.y - y : pt.y; i ? ctx.lineTo(px,py) : ctx.moveTo(px,py); }); ctx.closePath(); ctx.clip();
      if (tight) ctx.drawImage(state.source.image, x, y, w, h, 0, 0, w, h); else ctx.drawImage(state.source.image, 0, 0); ctx.restore();
    } else {
      if (tight) ctx.drawImage(state.source.image, x, y, w, h, 0, 0, w, h); else ctx.drawImage(state.source.image, 0, 0);
    }
    return c.toDataURL('image/png');
  }

  async function renderFrameToDataUrl(row, col, scale = 1) {
    const cell = frameCell(row, col);
    const c = document.createElement('canvas'); c.width = cell.w * scale; c.height = cell.h * scale;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = !!state.export.smoothing;
    ctx.drawImage(state.source.image, cell.x, cell.y, cell.w, cell.h, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }

  async function importAssetImages(files) {
    if (!files || !files.length) return;
    pushHistory();
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file);
      const img = await loadImage(dataUrl);
      const asset = { id: uid('asset'), name: file.name.replace(/\.[^.]+$/, ''), category: 'other', dataUrl, thumb: dataUrl, frameSize: Math.max(img.naturalWidth, img.naturalHeight), directions: [], animations: [], zOrder: 100, creator: 'DocDamage', license: 'private', sourceUrl: '', notes: 'Imported asset image.', tags: [], createdAt: new Date().toISOString() };
      state.library.push(asset);
    }
    saveLibraryToStorage(); toast(`Imported ${files.length} asset(s).`, 'ok'); setMode('library');
  }

  function loadLibraryFromStorage() {
    try {
      state.library = libraryStorageAdapter.loadCanonicalLibrary();
      state.plugins.enabled = v7StorageBridge.loadPluginSettings();
      if (window.DocSpriteSlicerV7) window.DocSpriteSlicerV7.libraryStorageStatus = libraryStorageAdapter.status();
    } catch {
      state.library = [];
    }
  }
  function saveLibraryToStorage() {
    try {
      libraryStorageAdapter.saveCanonicalLibrary(state.library);
      if (window.DocSpriteSlicerV7) window.DocSpriteSlicerV7.libraryStorageStatus = libraryStorageAdapter.status();
    } catch (err) {
      toast('Library is too large for browser local storage. Export it as JSON.', 'warn');
    }
  }
  function mergeAssets(a, b) { const map = new Map(a.map(x => [x.id,x])); for (const asset of b || []) map.set(asset.id, asset); return [...map.values()]; }

  function addSelectedAssetToRecipe() {
    const asset = state.ui.selected.type === 'asset' && getSelectedObject();
    if (!asset) return toast('Select a library asset first.', 'warn');
    pushHistory();
    state.recipe.layers.push({ id: uid('recipe_layer'), assetId: asset.id, enabled: true, zOrder: asset.zOrder || 100, opacity: 1, directionOverrides: {}, paletteMap: {} });
    setMode('recipe'); toast(`${asset.name} added to recipe.`, 'ok');
  }

  async function composeRecipe() {
    await drawRecipeCanvas();
    toast('Recipe preview composed.', 'ok');
  }

  async function drawRecipeCanvas(exportSize = 160) {
    const ctx = els.recipeCtx, c = els.recipeCanvas;
    ctx.clearRect(0,0,c.width,c.height); ctx.fillStyle = '#0b111c'; ctx.fillRect(0,0,c.width,c.height);
    const layers = state.recipe.layers.filter(l => l.enabled !== false).sort((a,b) => (a.zOrder||0)-(b.zOrder||0));
    for (const layer of layers) {
      const asset = state.library.find(a => a.id === layer.assetId); if (!asset) continue;
      const img = await loadImage(asset.dataUrl);
      ctx.globalAlpha = layer.opacity ?? 1; ctx.imageSmoothingEnabled = false;
      const scale = Math.min(c.width / img.naturalWidth, c.height / img.naturalHeight, 4);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      ctx.drawImage(img, (c.width-w)/2, (c.height-h)/2, w, h);
    }
    ctx.globalAlpha = 1;
  }

  function newRecipe() { pushHistory(); state.recipe = { id:'new_character', name:'New Character', base:'', layers:[], palette:'', exportProfile:state.export.profileId, directionOrderOverrides:{}, notes:'' }; syncToInputs(); setMode('recipe'); toast('New recipe created.', 'ok'); }
  function exportRecipe() { downloadJson(`${safeName(state.recipe.id)}.recipe.json`, state.recipe); }
  async function exportComposedRecipe() { await drawRecipeCanvas(); const blob = await canvasToBlob(els.recipeCanvas); downloadBlob(blob, `${safeName(state.recipe.id)}_preview.png`); }

  function moveRecipeLayerUp() { moveRecipeLayer(-1); }
  function moveRecipeLayerDown() { moveRecipeLayer(1); }
  function moveRecipeLayer(delta) { const id = state.ui.selected.id; const i = state.recipe.layers.findIndex(l => l.id === id); if (i < 0) return; const j = clamp(i+delta,0,state.recipe.layers.length-1); const [l] = state.recipe.layers.splice(i,1); state.recipe.layers.splice(j,0,l); }
  function removeRecipeLayer() { const id = state.ui.selected.id; state.recipe.layers = state.recipe.layers.filter(l => l.id !== id); state.ui.selected = { type:null, id:null }; }

  function duplicateSelectedAsset() { const asset = state.ui.selected.type === 'asset' && getSelectedObject(); if (!asset) return; const clone = { ...asset, id: uid('asset'), name: `${asset.name}_copy`, createdAt: new Date().toISOString() }; state.library.push(clone); saveLibraryToStorage(); selectObject('asset', clone.id); }
  function deleteSelectedAsset() { const asset = state.ui.selected.type === 'asset' && getSelectedObject(); if (!asset) return; state.library = state.library.filter(a => a.id !== asset.id); state.recipe.layers = state.recipe.layers.filter(l => l.assetId !== asset.id); saveLibraryToStorage(); state.ui.selected = { type:null,id:null }; toast('Asset deleted.', 'ok'); }

  async function importBatchImages(files) {
    if (!files || !files.length) return;
    pushHistory();
    for (const f of files) {
      const dataUrl = await fileToDataUrl(f), img = await loadImage(dataUrl);
      state.batch.push({ id: uid('batch'), name: f.name, dataUrl, width: img.naturalWidth, height: img.naturalHeight, enabled: true, status: 'queued', profileId: state.export.profileId, report: '' });
    }
    setMode('batch'); toast(`Imported ${files.length} sheet(s) to batch.`, 'ok');
  }

  function addCurrentToBatch() {
    if (!state.source.dataUrl) return toast('Load a source sheet first.', 'warn');
    pushHistory();
    state.batch.push({ id: uid('batch'), name: state.source.name || 'current_sheet.png', dataUrl: state.source.dataUrl, width: state.source.width, height: state.source.height, enabled: true, status: 'queued', profileId: state.export.profileId, grid: { ...state.grid }, report: '' });
    setMode('batch'); toast('Current sheet added to batch.', 'ok');
  }

  async function runBatch() {
    for (const job of state.batch.filter(j => j.enabled)) await runBatchJob(job);
    toast('Batch run complete.', 'ok');
  }

  async function runBatchJob(job) {
    const img = await loadImage(job.dataUrl);
    const grid = job.grid || guessGrid(img.naturalWidth, img.naturalHeight);
    const warnings = [];
    if (img.naturalWidth % grid.frameW !== 0 || img.naturalHeight % grid.frameH !== 0) warnings.push('Image dimensions do not divide evenly by guessed frame size.');
    job.grid = grid; job.status = warnings.length ? 'warnings' : 'pass';
    const log = { id: uid('batchlog'), jobId: job.id, jobName: job.name, status: job.status, warnings, createdAt: new Date().toISOString(), plugin: 'batch.qa_export' };
    state.batchLogs.push(log);
    job.report = `# Batch Report: ${job.name}\n\n- Size: ${img.naturalWidth}×${img.naturalHeight}\n- Grid: ${grid.cols}×${grid.rows}, ${grid.frameW}×${grid.frameH}\n- Status: ${job.status}\n${warnings.map(w => `- WARNING: ${w}`).join('\n') || '- PASS: Basic grid check passed.'}\n`;
  }

  async function runSelectedBatchJob() { const job = state.ui.selected.type === 'batch' && getSelectedObject(); if (!job) return; await runBatchJob(job); toast(`Ran ${job.name}.`, 'ok'); }
  function duplicateBatchJob() { const job = state.ui.selected.type === 'batch' && getSelectedObject(); if (!job) return; const clone = { ...job, id: uid('batch'), name: `${job.name}_copy`, status: 'queued' }; state.batch.push(clone); }
  function toggleBatchJob() { const job = state.ui.selected.type === 'batch' && getSelectedObject(); if (!job) return; job.enabled = !job.enabled; }

  function guessGrid(w,h) {
    const sizes=[16,24,32,48,64,96,128]; let size=64;
    for (const s of sizes) if (w%s===0 && h%s===0) { size=s; if (s===64) break; }
    return { cols: Math.max(1, Math.floor(w/size)), rows: Math.max(1, Math.floor(h/size)), frameW:size, frameH:size, marginX:0, marginY:0, spacingX:0, spacingY:0, rowLabels:[], directionLabels:['up','left','down','right'], baseName:'batch_sprite' };
  }

  async function exportBatchPackage() {
    const files = [{ name:'batch/batch_queue.json', data:textBytes(pretty(state.batch)) }, { name:'batch/batch_logs.json', data:textBytes(pretty(state.batchLogs)) }];
    for (const job of state.batch) {
      files.push({ name:`batch/reports/${safeName(job.name)}.md`, data:textBytes(job.report || `# ${job.name}\n\nNot run yet.\n`) });
      files.push({ name:`batch/projects/${safeName(job.name)}.json`, data:textBytes(pretty(job)) });
    }
    downloadBlob(createZip(files), 'doc_sprite_slicer_batch_package_v6.zip');
  }

  function runDiagnostics() {
    const diags = [];
    if (!state.source.image) diags.push(diag('fail','No source image','Import a spritesheet before exporting.'));
    else {
      let empty = 0, edge = 0, frames = 0;
      const footCenters = [];
      forEachCell((r,c) => {
        frames++;
        const box = frameBBox(r,c);
        if (box.empty) empty++;
        else {
          if (box.x <= 0 || box.y <= 0 || box.x + box.w >= state.grid.frameW || box.y + box.h >= state.grid.frameH) edge++;
          footCenters.push({ row:r, col:c, x:box.x + box.w/2, y:box.y + box.h });
        }
      });
      diags.push(diag('pass','Frame scan complete',`${frames} frame cells checked.`));
      if (empty) diags.push(diag(empty === frames ? 'fail' : 'warning', 'Empty frames detected', `${empty} empty frame(s). Remove, label, or ignore them before final export.`));
      if (edge) diags.push(diag('warning','Sprites touch frame edge',`${edge} frame(s) touch a cell edge. Increase padding or resize the frame to avoid clipping.`));
      const drift = maxFootDrift(footCenters);
      if (drift > 3) diags.push(diag('warning','Feet/root drift detected',`Max bottom-center drift is ${drift.toFixed(1)} px. Check alignment before animation export.`));
      else diags.push(diag('pass','Feet/root alignment acceptable',`Max drift is ${drift.toFixed(1)} px.`));
    }
    if (!state.grid.rowLabels.length) diags.push(diag('warning','Missing row labels','Add row labels so exports have useful animation names.'));
    if (state.parts.some(p => p.w <= 0 || p.h <= 0)) diags.push(diag('fail','Invalid rig part','At least one rig part has no area. Delete or redraw it.'));
    if (state.recipe.layers.some(l => !state.library.find(a => a.id === l.assetId))) diags.push(diag('fail','Recipe references missing asset','Remove or replace broken recipe layers.'));
    const missingCredits = state.recipe.layers.map(l => state.library.find(a => a.id === l.assetId)).filter(a => a && !a.license);
    if (missingCredits.length) diags.push(diag('warning','Missing license metadata',`${missingCredits.length} recipe asset(s) need license/credit metadata.`));
    diags.push(...runProjectIntegrityValidator(false));
    if (isPluginEnabled('validator.visual_diff')) diags.push(...runVisualDiffValidator(false));
    state.qa.diagnostics = diags; state.qa.lastRun = new Date().toISOString();
    updateQaSummary(); renderDiagnostics(); toast(`QA complete: ${qaCounts().fail} fail, ${qaCounts().warning} warning.`, qaCounts().fail ? 'fail' : qaCounts().warning ? 'warn' : 'ok');
  }

  function diag(severity,title,message) { return { id:uid('diag'), severity, title, message, at:new Date().toISOString() }; }
  function maxFootDrift(points) { if (!points.length) return 0; const xs = points.map(p=>p.x).sort((a,b)=>a-b); const mid = xs[Math.floor(xs.length/2)]; return Math.max(...xs.map(x=>Math.abs(x-mid))); }
  function qaCounts() { return { pass: state.qa.diagnostics.filter(d=>d.severity==='pass').length, warning: state.qa.diagnostics.filter(d=>d.severity==='warning').length, fail: state.qa.diagnostics.filter(d=>d.severity==='fail').length }; }
  function checkQaGate() { const c = qaCounts(); if (state.qa.blockFailures && c.fail) return { ok:false, reason:`Blocked by ${c.fail} QA failure(s). Run QA and fix failures or disable strict gate.` }; if (!state.qa.allowWarnings && c.warning) return { ok:false, reason:`Blocked by ${c.warning} QA warning(s).` }; return { ok:true }; }

  function frameBBox(row,col) {
    if (!state.source.image) return { empty:true, x:0,y:0,w:0,h:0 };
    const cell = frameCell(row,col); const c = getSourceCanvas(); const ctx = c.getContext('2d', { willReadFrequently: true });
    const data = ctx.getImageData(cell.x, cell.y, cell.w, cell.h).data;
    let minX=cell.w, minY=cell.h, maxX=-1, maxY=-1;
    for (let y=0; y<cell.h; y++) for (let x=0; x<cell.w; x++) { const a = data[(y*cell.w+x)*4+3]; if (a > 8) { if (x<minX) minX=x; if (y<minY) minY=y; if (x>maxX) maxX=x; if (y>maxY) maxY=y; } }
    if (maxX < 0) return { empty:true, x:0,y:0,w:0,h:0 };
    return { empty:false, x:minX, y:minY, w:maxX-minX+1, h:maxY-minY+1 };
  }

  let sourceCanvasCache = null;
  function getSourceCanvas() {
    if (sourceCanvasCache && sourceCanvasCache._dataUrl === state.source.dataUrl) return sourceCanvasCache;
    const c = document.createElement('canvas'); c.width = state.source.width; c.height = state.source.height; c._dataUrl = state.source.dataUrl;
    c.getContext('2d').drawImage(state.source.image,0,0);
    sourceCanvasCache = c; return c;
  }

  function exportReport() { downloadText('sprite_qa_report.md', buildQaReport()); }
  function buildQaReport() {
    const c = qaCounts();
    return `# Doc Sprite Slicer Studio v6 QA Report\n\nGenerated: ${new Date().toISOString()}\nSource: ${state.source.name || 'none'}\nGrid: ${state.grid.cols}×${state.grid.rows}, ${state.grid.frameW}×${state.grid.frameH}\n\n## Gate Summary\n\n- Pass: ${c.pass}\n- Warnings: ${c.warning}\n- Failures: ${c.fail}\n- Block failures: ${state.qa.blockFailures}\n- Allow warnings: ${state.qa.allowWarnings}\n\n## Findings\n\n${state.qa.diagnostics.map(d => `### ${d.severity.toUpperCase()}: ${d.title}\n${d.message}\n`).join('\n') || 'QA has not been run.'}\n`;
  }

  function toggleBlockFailures() { state.qa.blockFailures = !state.qa.blockFailures; syncToInputs(); toast(`Block failures ${state.qa.blockFailures ? 'on' : 'off'}.`, 'ok'); }
  function toggleAllowWarnings() { state.qa.allowWarnings = !state.qa.allowWarnings; syncToInputs(); toast(`Allow warnings ${state.qa.allowWarnings ? 'on' : 'off'}.`, 'ok'); }

  async function exportFramesZip() {
    if (!state.source.image) return toast('Load a source first.', 'warn');
    if (!state.qa.lastRun) runDiagnostics();
    const gate = checkQaGate(); if (!gate.ok) return toast(gate.reason, 'fail');
    const files = [];
    forEachCell((r,c,cell) => files.push(renderFrameFile(r,c)));
    const resolved = await Promise.all(files);
    downloadBlob(createZip(resolved), `${safeName(state.grid.baseName)}_frames_v6.zip`);
  }

  async function exportSelectedFrame() {
    if (!state.source.image) return toast('Load a source first.', 'warn');
    const { row, col } = state.ui.selectedFrame;
    const dataUrl = await renderFrameToDataUrl(row, col, state.export.scale);
    downloadBlob(new Blob([dataUrlToUint8(dataUrl)], { type: 'image/png' }), `${safeName(state.grid.baseName)}_${row}_${col}.png`);
    toast(`Exported frame ${row}:${col}.`, 'ok');
  }

  async function renderFrameFile(row,col) {
    const dataUrl = await renderFrameToDataUrl(row,col,state.export.scale);
    const path = framePath(row,col);
    return { name:path, data: dataUrlToUint8(dataUrl) };
  }

  function framePath(row,col) {
    const profile = state.profiles[state.export.profileId] || state.profiles.generic;
    const rowLabel = safeName(state.grid.rowLabels[row] || `row_${row+1}`);
    const file = (profile.file || '{base}_{row}_{col}').replace('{base}', safeName(state.grid.baseName)).replace('{row}', rowLabel).replace('{col}', String(col+1).padStart(2,'0')) + '.png';
    const folder = state.export.folderByRow ? (profile.folder || 'frames/{row}').replace('{row}', rowLabel).replace('{base}', safeName(state.grid.baseName)) : 'frames';
    return `${folder}/${file}`;
  }

  async function exportWorkspaceZip() {
    if (!state.qa.lastRun) runDiagnostics();
    const gate = checkQaGate(); if (!gate.ok) return toast(gate.reason, 'fail');
    const files = [];
    files.push({ name:'project/project.spriteproject.json', data:textBytes(pretty(projectSnapshot(false))) });
    files.push({ name:'manifests/manifest.json', data:textBytes(pretty(buildManifest())) });
    files.push({ name:'reports/qa_report.md', data:textBytes(buildQaReport()) });
    files.push({ name:'profiles/export_profiles.json', data:textBytes(pretty(state.profiles)) });
    files.push({ name:'plugins/plugin_manifest.json', data:textBytes(pretty(buildPluginManifest())) });
    files.push({ name:'plugins/plugin_settings.json', data:textBytes(pretty(state.plugins.enabled)) });
    files.push({ name:'reports/visual_qa_diff.json', data:textBytes(pretty(state.visualDiff.length ? state.visualDiff : buildVisualDiffSummary())) });
    files.push({ name:'reports/batch_logs.json', data:textBytes(pretty(state.batchLogs || [])) });
    files.push({ name:'manifests/export_preview.json', data:textBytes(pretty(buildExportPreview())) });
    files.push({ name:'timeline/timeline_clips.json', data:textBytes(pretty(buildTimelineManifest())) });
    files.push({ name:'poses/pose_library.json', data:textBytes(pretty(state.poseLibrary || [])) });
    files.push({ name:'remap/remap_plan.json', data:textBytes(pretty(state.remap.plan || [])) });
    files.push({ name:'atlas/atlas_manifest.json', data:textBytes(pretty(state.atlas.manifest || buildAtlasManifest())) });
    files.push({ name:'runtime/runtime_bundle.json', data:textBytes(pretty(buildRuntimeBundle())) });
    files.push({ name:'recipes/character_recipe.json', data:textBytes(pretty(state.recipe)) });
    files.push({ name:'library/asset_library.json', data:textBytes(pretty(state.library)) });
    if (state.export.includeCredits) {
      const credits = buildCredits(); files.push({ name:'credits/CREDITS.md', data:textBytes(credits.md) }); files.push({ name:'credits/CREDITS.csv', data:textBytes(credits.csv) });
    }
    if (state.source.image) {
      const frameFiles = await Promise.all(Array.from({ length: state.grid.rows * state.grid.cols }, (_, i) => renderFrameFile(Math.floor(i/state.grid.cols), i%state.grid.cols)));
      files.push(...frameFiles);
      for (const part of state.parts) files.push({ name:`rig_parts/${safeName(part.category)}/${safeName(part.name)}_${part.row}_${part.col}.png`, data:dataUrlToUint8(await renderPartToDataUrl(part, true)) });
    }
    for (const asset of state.library) files.push({ name:`library/assets/${safeName(asset.category)}/${safeName(asset.name)}_${asset.id}.png`, data:dataUrlToUint8(asset.dataUrl) });
    downloadBlob(createZip(files), `doc_sprite_slicer_studio_v6_workspace_${safeName(state.grid.baseName || state.recipe.id)}.zip`);
    toast('Workspace ZIP exported.', 'ok');
  }

  function buildManifest() {
    return { version: VERSION, generatedAt: new Date().toISOString(), source: { name: state.source.name, width: state.source.width, height: state.source.height }, grid: state.grid, export: state.export, profile: state.profiles[state.export.profileId], frames: buildFrameManifest(), pivots: state.pivots, parts: state.parts.map(p => ({ ...p, points: p.points || undefined })), recipe: state.recipe, timeline: buildTimelineManifest(), poseLibrary: state.poseLibrary, remap: state.remap, atlas: state.atlas.manifest || buildAtlasManifest(), runtimeBundle: state.runtimeBundle, pluginsEnabled: state.plugins.enabled, exportPreview: buildExportPreview() };
  }
  function buildFrameManifest() { const frames=[]; forEachCell((r,c,cell)=>frames.push({ row:r, col:c, label:state.grid.rowLabels[r] || `row_${r+1}`, path:framePath(r,c), x:cell.x,y:cell.y,w:cell.w,h:cell.h })); return frames; }
  function buildAnimationManifest() { return { fps: state.anim.fps, rows: state.grid.rowLabels, clips: state.timeline.clips.length ? state.timeline.clips : state.grid.rowLabels.map((label,row)=>({ name: label, row, frames: state.anim.cycle.length ? state.anim.cycle : Array.from({length:state.grid.cols},(_,i)=>i), fps: state.anim.fps, loop: true })) }; }
  function generateClips() { downloadJson('animation_clips_preview.json', buildAnimationManifest()); toast('Animation clips generated/exported.', 'ok'); }

  async function exportRigLayers() { const files=[]; for (const p of state.parts) files.push({ name:`rig_layers/${safeName(p.category)}/${safeName(p.name)}.png`, data:dataUrlToUint8(await renderPartToDataUrl(p, true)) }); files.push({ name:'rig_layers/pivots.json', data:textBytes(pretty(state.pivots)) }); downloadBlob(createZip(files), 'rig_layers_v6.zip'); }
  async function exportLpcLayerSheets() { await exportRigLayers(); }
  async function composeLayers() { toast('Layer composition uses recipe preview in v6. Add assets to recipe for deterministic stacking.', 'ok'); setMode('recipe'); await composeRecipe(); }
  async function exportComposedSheet() { await exportComposedRecipe(); }

  function buildCredits() {
    const assets = state.recipe.layers.map(l => state.library.find(a => a.id === l.assetId)).filter(Boolean);
    const all = assets.length ? assets : state.library;
    const rows = all.map(a => ({ name:a.name, creator:a.creator || 'DocDamage', license:a.license || 'private', sourceUrl:a.sourceUrl || '', notes:a.notes || '' }));
    const md = `# Credits\n\n${rows.map(r => `- **${r.name}** — ${r.creator}; license: ${r.license}${r.sourceUrl ? `; source: ${r.sourceUrl}` : ''}${r.notes ? `; notes: ${r.notes}` : ''}`).join('\n') || 'No assets in library/recipe.'}\n`;
    const csv = ['name,creator,license,source_url,notes', ...rows.map(r => [r.name,r.creator,r.license,r.sourceUrl,r.notes].map(csvEscape).join(','))].join('\n');
    return { md, csv };
  }
  function csvEscape(v) { return `"${String(v ?? '').replace(/"/g,'""')}"`; }
  function exportCredits() { const c = buildCredits(); downloadText('CREDITS.md', c.md); downloadText('CREDITS.csv', c.csv); }
  function exportLibrary() { downloadJson('doc_sprite_asset_library_v6.json', { version: VERSION, assets: state.library }); }
  async function importLibraryFile(file) { if (!file) return; const json = JSON.parse(await file.text()); state.library = mergeAssets(state.library, json.assets || json.library || []); saveLibraryToStorage(); toast('Library imported.', 'ok'); }

  function setProfile(id) { state.export.profileId = id; state.recipe.exportProfile = id; syncToInputs(); toast(`Export profile: ${state.profiles[id].name}.`, 'ok'); }
  function saveCustomProfile() { const id = uid('profile'); state.profiles[id] = { ...state.profiles[state.export.profileId], id, name: `Custom ${Object.keys(state.profiles).length + 1}`, scale: state.export.scale, folderByRow: state.export.folderByRow }; renderProfileSelects(); setProfile(id); }
  function exportProfiles() { downloadJson('export_profiles_v6.json', state.profiles); }

  function extractPalette() {
    if (!state.source.image) return toast('Load a source first.', 'warn');
    const c = getSourceCanvas(), ctx = c.getContext('2d', { willReadFrequently:true }); const data = ctx.getImageData(0,0,c.width,c.height).data;
    const counts = new Map();
    for (let i=0; i<data.length; i+=4) { if (data[i+3] < 8) continue; const hex = rgbToHex(data[i],data[i+1],data[i+2]); counts.set(hex,(counts.get(hex)||0)+1); }
    state.palette = [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,64).map(([hex,count])=>({hex,count}));
    renderPalette(); toast(`Extracted ${state.palette.length} colors.`, 'ok');
  }
  function rgbToHex(r,g,b) { return '#' + [r,g,b].map(n => n.toString(16).padStart(2,'0')).join(''); }
  async function replaceColor() {
    if (!state.source.image) return toast('Load a source first.', 'warn');
    const from = parseHex(els.fromColorInput.value), to = parseHex(els.toColorInput.value); if (!from || !to) return toast('Enter valid #RRGGBB colors.', 'warn');
    pushHistory(); const c = getSourceCanvas(); const ctx = c.getContext('2d', { willReadFrequently:true }); const img = ctx.getImageData(0,0,c.width,c.height); let n=0;
    for (let i=0; i<img.data.length; i+=4) if (img.data[i]===from[0] && img.data[i+1]===from[1] && img.data[i+2]===from[2] && img.data[i+3] > 0) { img.data[i]=to[0]; img.data[i+1]=to[1]; img.data[i+2]=to[2]; n++; }
    ctx.putImageData(img,0,0); state.source.dataUrl = c.toDataURL('image/png'); state.source.image = await loadImage(state.source.dataUrl); sourceCanvasCache = null; draw(); toast(`Replaced ${n} pixel(s).`, 'ok');
  }
  function parseHex(s) { const m = /^#?([0-9a-f]{6})$/i.exec(String(s).trim()); if (!m) return null; const v=m[1]; return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16)]; }

  function deleteSelection() {
    const {type,id} = state.ui.selected; if (!type || !id) return toast('Nothing selected.', 'warn'); pushHistory();
    if (type === 'part') state.parts = state.parts.filter(x=>x.id!==id);
    if (type === 'pivot') state.pivots = state.pivots.filter(x=>x.id!==id);
    if (type === 'asset') deleteSelectedAsset();
    if (type === 'recipeLayer') removeRecipeLayer();
    if (type === 'batch') state.batch = state.batch.filter(x=>x.id!==id);
    if (type === 'layer') state.layers = state.layers.filter(x=>x.id!==id);
    if (type === 'timelineClip') state.timeline.clips = state.timeline.clips.filter(x=>x.id!==id);
    if (type === 'pose') state.poseLibrary = state.poseLibrary.filter(x=>x.id!==id);
    state.ui.selected = { type:null,id:null }; renderAll(); draw();
  }

  function copySettings() { navigator.clipboard?.writeText(pretty({ grid:state.grid, export:state.export, qa:state.qa })).then(()=>toast('Settings copied.', 'ok')).catch(()=>downloadText('settings.json', pretty({grid:state.grid, export:state.export, qa:state.qa}))); }
  async function pasteSettings() { const text = prompt('Paste settings JSON:'); if (!text) return; const j = JSON.parse(text); Object.assign(state.grid, j.grid || {}); Object.assign(state.export, j.export || {}); Object.assign(state.qa, j.qa || {}); syncToInputs(); toast('Settings pasted.', 'ok'); }

  function renderAll(options = {}) {
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
  }
  function updateSourceLabels() { els.sourceName.textContent = state.source.name || 'No source loaded'; els.sourceMeta.textContent = state.source.width ? `${state.source.width}×${state.source.height} px | ${state.grid.cols}×${state.grid.rows} grid | ${state.grid.frameW}×${state.grid.frameH}` : 'Import a PNG/WebP/JPEG spritesheet to begin.'; }
  function renderPreviewRowSelect() { els.previewRowSelect.innerHTML = Array.from({ length: state.grid.rows }, (_, i) => `<option value="${i}">${i}: ${state.grid.rowLabels[i] || `row_${i+1}`}</option>`).join(''); els.previewRowSelect.value = clamp(state.anim.previewRow,0,state.grid.rows-1); }
  function renderLists() { renderParts(); renderPivots(); renderLayers(); renderAssets(); renderRecipeLayers(); renderBatch(); renderBatchLogs(); renderPlugins(); renderTimelineLists(); renderPoseLists(); renderRemapPreview(); renderAtlasPreview(); }
  function rowActive(type,id) { return state.ui.selected.type === type && state.ui.selected.id === id ? ' active' : ''; }
  function renderParts() { els.partList.innerHTML = state.parts.map(p => `<div class="object-row${rowActive('part',p.id)}" data-type="part" data-id="${p.id}"><div class="object-main"><strong>${escapeHtml(p.name)}</strong><span>${p.category} | ${p.type} | frame ${p.row}:${p.col}</span></div><span class="badge">z${p.zOrder}</span></div>`).join('') || '<span class="muted">No rig parts yet.</span>'; wireObjectRows(els.partList); }
  function renderPivots() { els.pivotList.innerHTML = state.pivots.map(p => `<div class="object-row${rowActive('pivot',p.id)}" data-type="pivot" data-id="${p.id}"><div class="object-main"><strong>${escapeHtml(p.name)}</strong><span>${p.kind || 'custom'} | ${Math.round(p.x)},${Math.round(p.y)}</span></div></div>`).join('') || '<span class="muted">No pivots yet.</span>'; wireObjectRows(els.pivotList); }
  function renderLayers() { els.layerList.innerHTML = state.layers.map(l => `<div class="object-row${rowActive('layer',l.id)}" data-type="layer" data-id="${l.id}"><img class="thumb" src="${l.dataUrl}"><div class="object-main"><strong>${escapeHtml(l.name)}</strong><span>${l.category || 'layer'} | z${l.zOrder || 100}</span></div></div>`).join('') || '<span class="muted">Layer stack is recipe-driven in v6.</span>'; wireObjectRows(els.layerList); }
  function renderAssets() { const q = (els.assetSearchInput.value || '').toLowerCase(), cat = els.assetCategoryFilter.value || 'all'; const assets = state.library.filter(a => (cat==='all'||a.category===cat) && JSON.stringify(a).toLowerCase().includes(q)); els.assetLibraryList.innerHTML = assets.map(a => `<div class="asset-card${rowActive('asset',a.id)}" data-type="asset" data-id="${a.id}"><img src="${a.thumb || a.dataUrl}" alt=""><strong>${escapeHtml(a.name)}</strong><span>${a.category} | ${a.license || 'private'}</span></div>`).join('') || '<span class="muted">No assets. Save rig parts or import asset images.</span>'; wireObjectRows(els.assetLibraryList); }
  function renderRecipeLayers() { els.recipeLayerList.innerHTML = state.recipe.layers.map((l,i) => { const a = state.library.find(x=>x.id===l.assetId); return `<div class="object-row${rowActive('recipeLayer',l.id)}" data-type="recipeLayer" data-id="${l.id}">${a?`<img class="thumb" src="${a.thumb || a.dataUrl}">`:''}<div class="object-main"><strong>${i+1}. ${escapeHtml(a?.name || 'Missing asset')}</strong><span>${a?.category || 'missing'} | ${l.enabled === false ? 'disabled' : 'enabled'} | z${l.zOrder}</span></div></div>`; }).join('') || '<span class="muted">Add assets from Library mode.</span>'; wireObjectRows(els.recipeLayerList); }
  function renderBatch() { els.batchList.innerHTML = state.batch.map(j => `<div class="object-row${rowActive('batch',j.id)}" data-type="batch" data-id="${j.id}"><div class="object-main"><strong>${escapeHtml(j.name)}</strong><span>${j.enabled ? 'enabled' : 'disabled'} | ${j.status}</span></div><span class="badge">${j.width}×${j.height}</span></div>`).join('') || '<span class="muted">No batch jobs.</span>'; wireObjectRows(els.batchList); }
  function wireObjectRows(root) { $$('.object-row,.asset-card', root).forEach(row => row.onclick = () => selectObject(row.dataset.type, row.dataset.id)); }

  function renderBatchLogs() {
    if (!els.batchLogList) return;
    const logs = (state.batchLogs || []).slice(-12).reverse();
    els.batchLogList.innerHTML = logs.map(l => `<div class="diag log-entry ${l.status === 'pass' ? 'pass' : l.status === 'warnings' ? 'warning' : 'fail'}"><strong>${escapeHtml(l.jobName || 'batch job')} — ${escapeHtml(l.status || 'log')}</strong>${escapeHtml((l.warnings || []).join('; ') || l.plugin || '')}</div>`).join('') || '<span class="muted">No batch logs yet.</span>';
  }
  function renderPlugins() {
    if (!els.pluginList) return;
    const q = (els.pluginSearchInput?.value || '').toLowerCase();
    const type = els.pluginTypeFilter?.value || 'all';
    const plugins = BUILTIN_PLUGINS.filter(p => (type === 'all' || p.type === type.replace(/s$/,'')) && JSON.stringify(p).toLowerCase().includes(q));
    els.pluginList.innerHTML = plugins.map(p => `<div class="object-row plugin-row${rowActive('plugin',p.id)}" data-type="plugin" data-id="${p.id}"><div class="object-main"><strong>${escapeHtml(p.name)}</strong><span><em class="plugin-type">${escapeHtml(p.type)}</em> v${escapeHtml(p.version)} | ${escapeHtml(p.description)}</span></div><span class="badge ${pluginBadge(p)}">${pluginBadge(p)}</span></div>`).join('') || '<span class="muted">No matching plugins.</span>';
    wireObjectRows(els.pluginList);
  }

  function renderDiagnostics() { els.diagnosticsList.innerHTML = state.qa.diagnostics.map(d => `<div class="diag ${d.severity}"><strong>${d.severity.toUpperCase()}: ${escapeHtml(d.title)}</strong>${escapeHtml(d.message)}</div>`).join('') || '<span class="muted">QA has not been run.</span>'; }
  function renderPalette() { els.paletteSwatches.innerHTML = state.palette.map(s => `<button class="swatch" style="background:${s.hex}" title="${s.hex} (${s.count})" data-color="${s.hex}"></button>`).join(''); $$('.swatch', els.paletteSwatches).forEach(sw => sw.onclick = () => { els.fromColorInput.value = sw.dataset.color; }); }
  function renderProfilePreview() { els.profilePreview.textContent = pretty(state.profiles[state.export.profileId] || state.profiles.generic); }
  function updateQaSummary() { const c=qaCounts(); els.qaSummary.textContent = `QA: ${c.fail} fail, ${c.warning} warn, ${c.pass} pass`; }
  function escapeHtml(s) { return String(s ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }

  function drawPreviewFrame() {
    const ctx = els.previewCtx, c = els.previewCanvas; ctx.clearRect(0,0,c.width,c.height); ctx.fillStyle='#0b111c'; ctx.fillRect(0,0,c.width,c.height);
    if (!state.source.image) return;
    const cycle = state.anim.cycle.length ? state.anim.cycle : Array.from({length:state.grid.cols},(_,i)=>i);
    const col = cycle[state.anim.tick % cycle.length] ?? 0, row = clamp(state.anim.previewRow,0,state.grid.rows-1), cell = frameCell(row, clamp(col,0,state.grid.cols-1));
    ctx.imageSmoothingEnabled = false; const scale = Math.min(c.width/cell.w, c.height/cell.h); ctx.drawImage(state.source.image, cell.x, cell.y, cell.w, cell.h, (c.width-cell.w*scale)/2, (c.height-cell.h*scale)/2, cell.w*scale, cell.h*scale);
  }
  function playPreview() { state.anim.playing = !state.anim.playing; if (state.anim.playing) startAnimTimer(); else clearInterval(state.anim.timer); }
  function startAnimTimer() { clearInterval(state.anim.timer); state.anim.timer = setInterval(() => { state.anim.tick++; drawPreviewFrame(); }, 1000/Math.max(1,state.anim.fps)); }

  function showCanvasContext(e) {
    if (!state.source.image) return;
    e.preventDefault(); const pt = sourcePointFromEvent(e); state.ui.selectedFrame = frameFromPoint(pt); draw();
    showContext(e.clientX,e.clientY,[['Slice This Frame','sliceThisFrame'],['Save Frame as Asset','saveFrameAsAsset'],['Set as Idle Reference','setFrameReference'],'sep',['Add Rect Part Here','addRectPart'],['Add Polygon Part','addPolygonPart'],['Place Pivot','addPivot'],'sep',['Run QA','runDiagnostics'],['Export Workspace ZIP','exportWorkspaceZip']]);
  }
  function showObjectContext(e) { const row = e.target.closest('[data-type]'); if (!row) return; e.preventDefault(); selectObject(row.dataset.type,row.dataset.id); const type=row.dataset.type; let items=[]; if (type==='asset') items=[['Add to Character','addSelectedAssetToRecipe'],['Duplicate Asset','duplicateSelectedAsset'],['Delete Asset','deleteSelectedAsset'],['Export Library','exportLibrary']]; if (type==='recipeLayer') items=[['Move Up','moveRecipeLayerUp'],['Move Down','moveRecipeLayerDown'],['Remove Layer','removeRecipeLayer'],['Compose Preview','composeRecipe']]; if (type==='batch') items=[['Run Job','runSelectedBatchJob'],['Duplicate Job','duplicateBatchJob'],['Enable/Disable','toggleBatchJob'],['Export Failed Only','exportFailedBatchOnly'],['Export Batch Package','exportBatchPackage']];
    if (type==='timelineClip') items=[['Apply to Animation','applyTimelineToAnimation'],['Duplicate Clip','duplicateTimelineClip'],['Delete Clip','deleteTimelineClip'],['Export Timeline JSON','exportTimelineJson']];
    if (type==='pose') items=[['Delete Pose','deletePose'],['Export Pose Library','exportPoseLibrary']];
    if (type==='plugin') items=[['Toggle Plugin','toggleSelectedPlugin'],['Export Plugin Manifest','exportPluginManifest'],['Export Plugin Report','exportPluginReport']]; if (type==='part') items=[['Save as Asset','saveSelectedPartAsAsset'],['Duplicate Mask to All Frames','duplicatePartAllFrames'],['Mirror Part','mirrorParts'],['Delete Part','deleteSelection']]; if (type==='pivot') items=[['Delete Pivot','deleteSelection']]; showContext(e.clientX,e.clientY,items); }
  function showContext(x,y,items) { els.contextMenu.innerHTML = items.map(it => it==='sep' ? '<div class="sep"></div>' : `<button data-action="${it[1]}">${it[0]}</button>`).join(''); els.contextMenu.style.left = `${x}px`; els.contextMenu.style.top = `${y}px`; els.contextMenu.hidden = false; }
  function hideContextMenu() { els.contextMenu.hidden = true; }

  const COMMANDS = [
    ['Import Spritesheet','openImage','File'],['Open Project','openProject','File'],['Save Project','saveProject','File'],['Recover Autosave','recoverAutosave','File'],['Export Workspace ZIP','exportWorkspaceZip','Export'],['Export Frames ZIP','exportFramesZip','Export'],['Detect Grid','detectGrid','Sheet'],['Apply LPC Preset','applyLpcPreset','Sheet'],['Assign LPC Row Labels','assignLpcRows','Sheet'],['Run Diagnostics','runDiagnostics','QA'],['Export QA Report','exportReport','QA'],['Add Rect Part','addRectPart','Rig'],['Add Polygon Part','addPolygonPart','Rig'],['Add Pivot','addPivot','Rig'],['Save Selected Part as Asset','saveSelectedPartAsAsset','Library'],['Import Asset Images','openAssetImages','Library'],['New Recipe','newRecipe','Recipe'],['Compose Recipe','composeRecipe','Recipe'],['Import Batch Sheets','openBatchImages','Batch'],['Run Batch','runBatch','Batch'],['Godot 4 Profile','setExportGodot','Export'],['KeterEngine Profile','setExportKeter','Export'],['Timeline Lab','showTimelineLab','Animation Lab'],['Add Row Clip','buildTimelineClipFromRow','Animation Lab'],['Toggle Onion Skin','toggleOnionSkin','Animation Lab'],['Export Timeline JSON','exportTimelineJson','Animation Lab'],['Pose Lab','showPoseLab','Rig'],['Save Pose Snapshot','savePose','Rig'],['Sheet Remapper','showRemapLab','Sheet'],['Generate Remap Plan','generateRemapPreview','Sheet'],['Atlas Lab','showAtlasLab','Export'],['Pack Atlas Preview','packAtlas','Export'],['Export Runtime Bundle','exportRuntimeBundle','Export'],['Plugin Manager','showPluginManager','Tools'],['Asset Pack Importer','openAssetPack','Tools'],['Validate Project','validateProject','Tools'],['Run Visual QA Diff','runVisualDiff','QA'],['Export Preview','exportPreview','Export'],['Backup Project','backupProject','File']
  ];
  function showCommandPalette() { els.commandPalette.hidden = false; els.commandSearch.value=''; renderCommands(''); setTimeout(()=>els.commandSearch.focus(),20); }
  function hideCommandPalette() { els.commandPalette.hidden = true; }
  function renderCommands(q) { q = q.toLowerCase(); els.commandResults.innerHTML = COMMANDS.filter(c => c.join(' ').toLowerCase().includes(q)).map(c => `<button class="command-result" data-action="${c[1]}"><strong>${c[0]}</strong><span>${c[2]}</span></button>`).join(''); }

  function showTooltip(e) { const t = e.target.closest('[data-tip]'); if (!t) return; els.tooltip.textContent = t.dataset.tip; els.tooltip.hidden = false; moveTooltip(e); }
  function moveTooltip(e) { if (els.tooltip.hidden) return; els.tooltip.style.left = `${Math.min(window.innerWidth - 340, e.clientX + 14)}px`; els.tooltip.style.top = `${Math.min(window.innerHeight - 80, e.clientY + 14)}px`; }
  function hideTooltip(e) { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-tip]')) els.tooltip.hidden = true; }

  function toast(msg, type='ok') { const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=msg; els.toastStack.appendChild(el); setTimeout(()=>el.remove(),4200); els.statusText.textContent=msg; }
  function zoomFit() { if (!state.source.width) return; const stage = els.canvasStage.getBoundingClientRect(); state.view.zoom = clamp(Math.min((stage.width-64)/state.source.width, (stage.height-64)/state.source.height), .25, 8); draw(); }

  function fileToDataUrl(file) { return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
  function loadImage(src) { if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)); return new Promise((res,rej)=>{ const img=new Image(); img.onload=()=>{ imageCache.set(src,img); res(img); }; img.onerror=rej; img.src=src; }); }
  function dataUrlToUint8(dataUrl) { const b64 = dataUrl.split(',')[1] || ''; const bin = atob(b64); const arr = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); return arr; }
  function canvasToBlob(canvas) { return new Promise(res => canvas.toBlob(res, 'image/png')); }
  function downloadBlob(blob,name) { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
  function downloadText(name,text) { downloadBlob(new Blob([text], {type:'text/plain'}), name); }
  function downloadJson(name,obj) { downloadBlob(new Blob([pretty(obj)], {type:'application/json'}), name); }



  // ---------------- V6 production-hardening layer ----------------
  function isPluginEnabled(id) { return state.plugins?.enabled?.[id] !== false; }
  function pluginBadge(plugin) { return isPluginEnabled(plugin.id) ? 'enabled' : 'disabled'; }
  function savePluginSettings() {
    try {
      v7StorageBridge.savePluginSettings(state.plugins.enabled);
      if (window.DocSpriteSlicerV7) {
        window.DocSpriteSlicerV7.pluginSettings = v7StorageBridge.loadPluginSettings();
        window.DocSpriteSlicerV7.storageStatus = window.DocSpriteSlicerV7.storageBridge?.readRecoveryState ? window.DocSpriteSlicerV7.storageStatus : window.DocSpriteSlicerV7.storageStatus;
      }
    } catch {}
  }

  function migrateProject(project = {}) {
    return migrateV7Project(project);
  }

  function saveAutosaveSnapshot() {
    const snap = projectSnapshot(false);
    return v7StorageBridge.saveAutosaveSnapshot(snap, { slotId: uid('slot') });
  }

  async function restoreLatestAutosaveSlot() {
    const slots = v7StorageBridge.readRecoveryState().autosaveSlots || [];
    if (!slots.length) return toast('No autosave slots found.', 'warn');
    await restoreProject(slots[0].project);
    toast(`Restored autosave slot from ${new Date(slots[0].savedAt).toLocaleString()}.`, 'ok');
  }

  function clearRecoveryData() {
    if (!confirm('Clear autosave, autosave slots, and recent-project recovery data for this browser? Save your project first.')) return;
    v7StorageBridge.clearRecoveryState();
    toast('Recovery data cleared.', 'ok');
  }

  function backupProject() {
    const stamp = new Date().toISOString().replace(/[:.]/g,'-');
    downloadJson(`${safeName(state.grid.baseName || state.recipe.id || 'sprite_project')}_backup_${stamp}.spriteproject.json`, projectSnapshot(true));
    toast('Timestamped backup downloaded.', 'ok');
  }

  function exportRecoveryPackage() {
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
  }

  function showPluginManager() { setMode('plugins'); toast('Plugin Manager opened.', 'ok'); }
  function toggleSelectedPlugin() {
    const plugin = state.ui.selected.type === 'plugin' && getSelectedObject();
    if (!plugin) return toast('Select a plugin first.', 'warn');
    pushHistory();
    state.plugins.enabled[plugin.id] = !isPluginEnabled(plugin.id);
    savePluginSettings();
    toast(`${plugin.name} ${isPluginEnabled(plugin.id) ? 'enabled' : 'disabled'}.`, 'ok');
  }
  function enableAllPlugins() { pushHistory(); for (const p of BUILTIN_PLUGINS) state.plugins.enabled[p.id] = true; savePluginSettings(); toast('All plugins enabled.', 'ok'); }
  function disableAllPlugins() { pushHistory(); for (const p of BUILTIN_PLUGINS) state.plugins.enabled[p.id] = false; savePluginSettings(); toast('All plugins disabled. Core app remains usable.', 'warn'); }
  function buildPluginManifest() { return { version: VERSION, generatedAt:new Date().toISOString(), plugins: BUILTIN_PLUGINS.map(p => ({ ...p, enabled:isPluginEnabled(p.id) })) }; }
  function exportPluginManifest() { downloadJson('doc_sprite_slicer_v6_plugin_manifest.json', buildPluginManifest()); }
  function exportPluginReport() {
    const groups = BUILTIN_PLUGINS.reduce((acc,p)=>{ (acc[p.type] ||= []).push(p); return acc; }, {});
    const md = [`# V6 Plugin Report`, ``, `Generated: ${new Date().toISOString()}`, ``];
    for (const [type, items] of Object.entries(groups)) {
      md.push(`## ${type}`);
      for (const p of items) md.push(`- **${p.name}** (${p.id}) v${p.version} — ${isPluginEnabled(p.id) ? 'enabled' : 'disabled'} — ${p.description}`);
      md.push('');
    }
    downloadText('doc_sprite_slicer_v6_plugin_report.md', md.join('\n'));
  }

  async function importAssetPack(files) {
    if (!files || !files.length) return;
    pushHistory();
    const imported = [];
    let metadata = {}, creditsRows = [];
    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.json')) {
        try { metadata = { ...metadata, ...JSON.parse(await file.text()) }; } catch { toast(`Skipped invalid metadata JSON: ${file.name}`, 'warn'); }
      } else if (lower.endsWith('.csv')) {
        creditsRows.push(...parseCreditsCsv(await file.text()));
      }
    }
    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (!/\.(png|webp|jpe?g)$/.test(lower)) continue;
      const dataUrl = await fileToDataUrl(file);
      const img = await loadImage(dataUrl);
      const stem = file.name.replace(/\.[^.]+$/, '');
      const meta = metadata.assets?.find?.(a => a.file === file.name || a.name === stem) || metadata[stem] || {};
      const credit = creditsRows.find(r => r.name === stem || r.file === file.name) || {};
      const category = meta.category || inferCategoryFromName(file.webkitRelativePath || file.name);
      const asset = { id: meta.id || uid('asset'), name: meta.name || stem, category, dataUrl, thumb:dataUrl, frameSize: Math.max(img.naturalWidth,img.naturalHeight), directions: meta.directions || [], animations: meta.animations || [], zOrder: meta.zOrder || 100, creator: meta.creator || credit.creator || 'DocDamage', license: meta.license || credit.license || 'private', sourceUrl: meta.sourceUrl || credit.source_url || '', notes: meta.notes || credit.notes || `Imported from asset pack: ${file.webkitRelativePath || file.name}`, tags: meta.tags || [category], createdAt:new Date().toISOString() };
      state.library.push(asset); imported.push(asset);
    }
    saveLibraryToStorage(); setMode('library'); toast(`Asset pack imported ${imported.length} image asset(s).`, imported.length ? 'ok' : 'warn');
  }

  function parseCreditsCsv(text) {
    const lines = text.split(/\r?\n/).filter(Boolean); if (!lines.length) return [];
    const headers = lines.shift().split(',').map(h => h.trim().replace(/^"|"$/g,'').toLowerCase());
    return lines.map(line => {
      const cols = line.match(/("(?:""|[^"])*"|[^,]*)/g).filter((_,i)=>i%2===0).map(v => v.replace(/^"|"$/g,'').replace(/""/g,'"'));
      const row = {}; headers.forEach((h,i)=>row[h]=cols[i] || ''); return row;
    });
  }
  function inferCategoryFromName(name='') { const s = name.toLowerCase(); return CATEGORIES.find(c => s.includes(c) || s.includes(c.replace(/s$/,''))) || 'other'; }

  function validateProject() {
    const diags = runProjectIntegrityValidator(true);
    state.qa.diagnostics = [...(state.qa.diagnostics || []).filter(d => !d.source || d.source !== 'project_integrity'), ...diags];
    renderDiagnostics(); updateQaSummary();
    toast(`Project validation: ${diags.filter(d=>d.severity==='fail').length} failures, ${diags.filter(d=>d.severity==='warning').length} warnings.`, diags.some(d=>d.severity==='fail') ? 'fail' : 'ok');
  }
  function runProjectIntegrityValidator(markSource = true) {
    if (!isPluginEnabled('validator.project_integrity')) return [];
    const out = [];
    const add = (sev,title,msg) => { const d = diag(sev,title,msg); if (markSource) d.source = 'project_integrity'; out.push(d); };
    if (!state.version || state.version !== VERSION) add('warning','Project runtime version mismatch',`Runtime is ${VERSION}; project state reports ${state.version || 'unknown'}.`);
    if (!state.grid || !state.grid.frameW || !state.grid.frameH) add('fail','Invalid grid settings','Frame width and height are required for slicing/export.');
    if (!state.profiles[state.export.profileId]) add('fail','Missing export profile',`Active profile ${state.export.profileId} is not defined.`);
    const broken = state.recipe.layers.filter(l => !state.library.find(a => a.id === l.assetId));
    if (broken.length) add('fail','Broken recipe layers',`${broken.length} recipe layer(s) point to missing assets.`);
    const pluginIds = Object.keys(state.plugins.enabled || {});
    const unknown = pluginIds.filter(id => !BUILTIN_PLUGINS.find(p => p.id === id));
    if (unknown.length) add('warning','Unknown plugin settings',`${unknown.length} plugin setting(s) do not match built-in plugins and will be ignored.`);
    if (!state.source.dataUrl && !state.library.length) add('warning','No source or library assets','Import a spritesheet or asset pack before production export.');
    if (!out.length) add('pass','Project integrity passed','Schema, plugins, profiles, recipe links, and library basics are valid.');
    return out;
  }

  function runVisualDiff() {
    state.visualDiff = buildVisualDiffSummary();
    const diags = runVisualDiffValidator(true);
    state.qa.diagnostics = [...(state.qa.diagnostics || []).filter(d => d.source !== 'visual_diff'), ...diags];
    renderDiagnostics(); updateQaSummary();
    toast(`Visual QA diff complete: ${diags.filter(d=>d.severity==='warning').length} warnings.`, 'ok');
  }
  function buildVisualDiffSummary() {
    if (!state.source.image) return [];
    const rows = [];
    for (let r=0; r<state.grid.rows; r++) {
      const boxes = [];
      for (let c=0; c<state.grid.cols; c++) boxes.push({ col:c, ...frameBBox(r,c) });
      const centers = boxes.filter(b=>!b.empty).map(b => b.x + b.w/2);
      const widths = boxes.filter(b=>!b.empty).map(b => b.w);
      const heights = boxes.filter(b=>!b.empty).map(b => b.h);
      rows.push({ row:r, label:state.grid.rowLabels[r] || `row_${r+1}`, empty:boxes.filter(b=>b.empty).length, centerDrift:range(centers), widthDrift:range(widths), heightDrift:range(heights), boxes });
    }
    return rows;
  }
  function runVisualDiffValidator(markSource = true) {
    if (!isPluginEnabled('validator.visual_diff')) return [];
    const rows = state.visualDiff.length ? state.visualDiff : buildVisualDiffSummary();
    const out = [];
    const add = (sev,title,msg) => { const d = diag(sev,title,msg); if (markSource) d.source = 'visual_diff'; out.push(d); };
    if (!state.source.image) { add('warning','Visual diff skipped','Load a source image before visual QA diff checks.'); return out; }
    for (const r of rows) {
      if (r.centerDrift > 4) add('warning',`Center drift: ${r.label}`,`Frame center changes by ${r.centerDrift.toFixed(1)} px across this row.`);
      if (r.heightDrift > 8) add('warning',`Height drift: ${r.label}`,`Bounding-box height changes by ${r.heightDrift.toFixed(1)} px across this row.`);
      if (r.empty) add('warning',`Empty cells: ${r.label}`,`${r.empty} empty frame(s) found in this row.`);
    }
    if (!out.length) add('pass','Visual diff passed','No significant center, height, or empty-frame drift was found.');
    return out;
  }
  function range(arr) { return arr.length ? Math.max(...arr) - Math.min(...arr) : 0; }
  function exportVisualDiffReport() {
    const rows = state.visualDiff.length ? state.visualDiff : buildVisualDiffSummary();
    const md = `# Visual QA Diff Report\n\nGenerated: ${new Date().toISOString()}\n\n| Row | Label | Empty | Center Drift | Width Drift | Height Drift |\n|---:|---|---:|---:|---:|---:|\n${rows.map(r => `| ${r.row} | ${r.label} | ${r.empty} | ${r.centerDrift.toFixed(1)} | ${r.widthDrift.toFixed(1)} | ${r.heightDrift.toFixed(1)} |`).join('\n')}\n`;
    downloadText('visual_qa_diff_report.md', md);
  }

  function buildExportPreview() {
    const files = [];
    if (state.source.image) forEachCell((r,c)=>files.push({ type:'frame', row:r, col:c, path:framePath(r,c), profile:state.export.profileId }));
    files.push({ type:'manifest', path:`manifests/${(state.profiles[state.export.profileId] || state.profiles.generic).manifest}` });
    files.push({ type:'project', path:'project/project.spriteproject.json' });
    files.push({ type:'qa_report', path:'reports/qa_report.md' });
    if (state.export.includeCredits) files.push({ type:'credits', path:'credits/CREDITS.md' });
    return { version:VERSION, profile: state.profiles[state.export.profileId], generatedAt:new Date().toISOString(), files };
  }
  function exportPreview() { downloadJson('export_preview_v6.json', buildExportPreview()); toast('Export preview downloaded.', 'ok'); }

  function exportFailedBatchOnly() {
    const failed = state.batch.filter(j => ['fail','warnings'].includes(j.status));
    const files = failed.map(j => ({ name:`failed/${safeName(j.name)}.json`, data:textBytes(pretty(j)) }));
    files.push({ name:'failed/failed_items.json', data:textBytes(pretty(failed)) });
    downloadBlob(createZip(files), 'failed_batch_items_v6.zip');
  }

  function showShortcuts() { alert('Shortcuts\n\nCtrl+K: Command palette\nCtrl+S: Save project\nCtrl+Z: Undo\nCtrl+Y: Redo\nEsc: Cancel current tool/context menu\nDelete: Delete selected object\nRight-click canvas/items: context actions'); }
  function showAbout() { alert('Doc Sprite Slicer Studio v6\n\nV6 hardens the V6 pipeline with plugins, schema migration, autosave slots, asset-pack importing, visual QA diffs, modular exporters/validators, batch logs, and recovery packages.'); }

  function createZip(files) {
    const chunks=[], central=[]; let offset=0; const now=new Date(), dos=dosDateTime(now);
    for (const file of files) {
      const nameBytes = enc.encode(file.name.replace(/^\/+/, ''));
      const data = file.data instanceof Uint8Array ? file.data : textBytes(String(file.data ?? ''));
      const crc = crc32(data);
      const local = new Uint8Array(30 + nameBytes.length); const v = new DataView(local.buffer);
      v.setUint32(0,0x04034b50,true); v.setUint16(4,20,true); v.setUint16(6,0,true); v.setUint16(8,0,true); v.setUint16(10,dos.time,true); v.setUint16(12,dos.date,true); v.setUint32(14,crc,true); v.setUint32(18,data.length,true); v.setUint32(22,data.length,true); v.setUint16(26,nameBytes.length,true); v.setUint16(28,0,true); local.set(nameBytes,30); chunks.push(local,data);
      const cent = new Uint8Array(46 + nameBytes.length); const cv = new DataView(cent.buffer);
      cv.setUint32(0,0x02014b50,true); cv.setUint16(4,20,true); cv.setUint16(6,20,true); cv.setUint16(8,0,true); cv.setUint16(10,0,true); cv.setUint16(12,dos.time,true); cv.setUint16(14,dos.date,true); cv.setUint32(16,crc,true); cv.setUint32(20,data.length,true); cv.setUint32(24,data.length,true); cv.setUint16(28,nameBytes.length,true); cv.setUint16(30,0,true); cv.setUint16(32,0,true); cv.setUint16(34,0,true); cv.setUint16(36,0,true); cv.setUint32(38,0,true); cv.setUint32(42,offset,true); cent.set(nameBytes,46); central.push(cent); offset += local.length + data.length;
    }
    const centralOffset = offset; let centralSize = 0; for (const c of central) { chunks.push(c); centralSize += c.length; }
    const end = new Uint8Array(22); const ev = new DataView(end.buffer); ev.setUint32(0,0x06054b50,true); ev.setUint16(4,0,true); ev.setUint16(6,0,true); ev.setUint16(8,files.length,true); ev.setUint16(10,files.length,true); ev.setUint32(12,centralSize,true); ev.setUint32(16,centralOffset,true); ev.setUint16(20,0,true); chunks.push(end);
    return new Blob(chunks, {type:'application/zip'});
  }
  function dosDateTime(date) { return { time:(date.getHours()<<11)|(date.getMinutes()<<5)|Math.floor(date.getSeconds()/2), date:((date.getFullYear()-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate() }; }
  const CRC_TABLE = (() => { const table = new Uint32Array(256); for (let i=0;i<256;i++) { let c=i; for (let k=0;k<8;k++) c = c & 1 ? 0xedb88320 ^ (c>>>1) : c>>>1; table[i]=c>>>0; } return table; })();
  function crc32(data) { let c=0xffffffff; for (let i=0;i<data.length;i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c>>>8); return (c ^ 0xffffffff) >>> 0; }

  // -----------------------------
  // V6 Animation Lab + Runtime Pipeline
  // -----------------------------
  function showTimelineLab() { setMode('timeline'); toast('Timeline Lab opened.', 'ok'); }
  function showPoseLab() { setMode('pose'); toast('Pose Lab opened.', 'ok'); }
  function showRemapLab() { setMode('remap'); toast('Sheet Remapper opened.', 'ok'); }
  function showAtlasLab() { setMode('atlas'); toast('Atlas Lab opened.', 'ok'); }

  function renderTimelineRowSelect() {
    if (!els.timelineRowSelect) return;
    els.timelineRowSelect.innerHTML = Array.from({ length: state.grid.rows }, (_, i) => `<option value="${i}">${i}: ${escapeHtml(state.grid.rowLabels[i] || `row_${i+1}`)}</option>`).join('');
    els.timelineRowSelect.value = clamp(state.timeline.selectedRow ?? state.anim.previewRow ?? 0, 0, Math.max(0, state.grid.rows - 1));
  }

  function buildTimelineClipFromRow() {
    const row = clamp(Number(els.timelineRowSelect?.value ?? state.anim.previewRow ?? 0), 0, state.grid.rows - 1);
    const label = state.grid.rowLabels[row] || `row_${row+1}`;
    const name = safeName(els.timelineClipName?.value || label || `clip_${row+1}`);
    const frames = (state.anim.cycle.length ? state.anim.cycle : Array.from({ length: state.grid.cols }, (_, i) => i)).filter(i => i >= 0 && i < state.grid.cols);
    const fps = intVal(els.timelineFpsInput || els.fpsInput, 1) || state.anim.fps || 8;
    const clip = { id: uid('clip'), name, row, rowLabel: label, frames, fps, loop: true, durations: frames.map(() => Math.round(1000 / fps)), createdAt: new Date().toISOString() };
    pushHistory();
    state.timeline.clips.push(clip);
    state.timeline.selectedClipId = clip.id;
    selectObject('timelineClip', clip.id);
    renderAll();
    toast(`Timeline clip created: ${name}.`, 'ok');
  }

  function duplicateTimelineClip() {
    const clip = state.ui.selected.type === 'timelineClip' ? getSelectedObject() : state.timeline.clips.find(c => c.id === state.timeline.selectedClipId);
    if (!clip) return toast('Select a timeline clip first.', 'warn');
    pushHistory();
    const copy = { ...JSON.parse(JSON.stringify(clip)), id: uid('clip'), name: `${clip.name}_copy`, createdAt: new Date().toISOString() };
    state.timeline.clips.push(copy);
    selectObject('timelineClip', copy.id);
    toast('Timeline clip duplicated.', 'ok');
  }

  function deleteTimelineClip() { deleteSelection(); }

  function applyTimelineToAnimation() {
    const clip = state.ui.selected.type === 'timelineClip' ? getSelectedObject() : state.timeline.clips.find(c => c.id === state.timeline.selectedClipId);
    if (!clip) return toast('Select a timeline clip first.', 'warn');
    state.anim.previewRow = clip.row;
    state.anim.fps = clip.fps;
    state.anim.cycle = [...clip.frames];
    syncToInputs();
    setMode('animate');
    toast(`Applied ${clip.name} to preview.`, 'ok');
  }

  function toggleOnionSkin() {
    state.timeline.onionSkin.enabled = !state.timeline.onionSkin.enabled;
    if (els.onionEnabledInput) els.onionEnabledInput.checked = state.timeline.onionSkin.enabled;
    draw();
    toast(`Onion skin ${state.timeline.onionSkin.enabled ? 'enabled' : 'disabled'}.`, 'ok');
  }

  function buildTimelineManifest() {
    return { version: VERSION, generatedAt: new Date().toISOString(), onionSkin: state.timeline.onionSkin, clips: state.timeline.clips, rows: state.grid.rowLabels };
  }
  function exportTimelineJson() { downloadJson('timeline_clips_v6.json', buildTimelineManifest()); }
  function exportTimelineZip() {
    const files = [{ name:'timeline/timeline_clips.json', data:textBytes(pretty(buildTimelineManifest())) }];
    downloadBlob(createZip(files), 'timeline_package_v6.zip');
  }

  function renderTimelineLists() {
    if (els.timelineClipList) {
      els.timelineClipList.innerHTML = state.timeline.clips.map(c => `<div class="object-row${rowActive('timelineClip',c.id)}" data-type="timelineClip" data-id="${c.id}"><div class="object-main"><strong>${escapeHtml(c.name)}</strong><span>row ${c.row}: ${escapeHtml(c.rowLabel || '')} | ${c.frames.length} frames | ${c.fps} fps | ${c.loop ? 'loop' : 'once'}</span></div><span class="clip-pill">${c.frames.length}</span></div>`).join('') || '<span class="muted">No timeline clips. Add one from the selected row.</span>';
      wireObjectRows(els.timelineClipList);
    }
    if (els.timelineFrameList) {
      const clip = state.ui.selected.type === 'timelineClip' ? getSelectedObject() : state.timeline.clips.find(c => c.id === state.timeline.selectedClipId) || state.timeline.clips[0];
      els.timelineFrameList.innerHTML = clip ? clip.frames.map((f, i) => `<div class="timeline-frame"><span>Frame ${i+1}: column ${f}</span><span class="duration-pill">${clip.durations?.[i] ?? Math.round(1000/(clip.fps||8))}ms</span></div>`).join('') : '<span class="muted">Select or create a clip to inspect frame timing.</span>';
    }
  }

  function drawOnionSkin(ctx, z) {
    if (!state.source.image || !state.timeline?.onionSkin?.enabled) return;
    const skin = state.timeline.onionSkin;
    const sel = state.ui.selectedFrame || { row:0, col:0 };
    const dest = frameCell(sel.row, sel.col);
    const offsets = [];
    for (let i = skin.prev; i >= 1; i--) offsets.push(-i);
    for (let i = 1; i <= skin.next; i++) offsets.push(i);
    ctx.save();
    ctx.globalAlpha = clamp(Number(skin.opacity || .24), 0, 1);
    for (const offset of offsets) {
      const col = sel.col + offset;
      if (col < 0 || col >= state.grid.cols) continue;
      const src = frameCell(sel.row, col);
      ctx.drawImage(state.source.image, src.x, src.y, src.w, src.h, dest.x*z, dest.y*z, dest.w*z, dest.h*z);
    }
    ctx.restore();
  }

  function selectedPartTransform() {
    const part = state.ui.selected.type === 'part' ? getSelectedObject() : null;
    if (!part) return null;
    if (!state.posePreview.transforms[part.id]) state.posePreview.transforms[part.id] = { partId: part.id, partName: part.name, rotation: 0, x: 0, y: 0, scale: 1 };
    return state.posePreview.transforms[part.id];
  }
  function testRotateSelectedPartLeft() { const t = selectedPartTransform(); if (!t) return toast('Select a rig part first.', 'warn'); t.rotation -= 15; renderAll(); toast(`Part rotation: ${t.rotation}°`, 'ok'); }
  function testRotateSelectedPartRight() { const t = selectedPartTransform(); if (!t) return toast('Select a rig part first.', 'warn'); t.rotation += 15; renderAll(); toast(`Part rotation: ${t.rotation}°`, 'ok'); }
  function resetPartTransform() { const t = selectedPartTransform(); if (!t) return toast('Select a rig part first.', 'warn'); Object.assign(t, { rotation: 0, x: 0, y: 0, scale: 1 }); renderAll(); toast('Part transform reset.', 'ok'); }

  function savePose() {
    const part = state.ui.selected.type === 'part' ? getSelectedObject() : null;
    if (!part) return toast('Select a rig part before saving a pose.', 'warn');
    const transform = selectedPartTransform();
    const pose = { id: uid('pose'), name: safeName(els.poseNameInput?.value || `${part.name}_pose`), createdAt: new Date().toISOString(), frame: { row: part.row, col: part.col }, transforms: { [part.id]: { ...transform } } };
    pushHistory();
    state.poseLibrary.push(pose);
    selectObject('pose', pose.id);
    renderAll();
    toast(`Pose saved: ${pose.name}.`, 'ok');
  }
  function deletePose() { deleteSelection(); }
  function exportPoseLibrary() { downloadJson('pose_library_v6.json', { version: VERSION, poses: state.poseLibrary }); }

  function renderPoseLists() {
    if (els.posePartList) {
      const part = state.ui.selected.type === 'part' ? getSelectedObject() : null;
      const t = part ? selectedPartTransform() : null;
      els.posePartList.innerHTML = part ? `<div class="pose-transform"><span>${escapeHtml(part.name)} | ${escapeHtml(part.category)}</span><span class="duration-pill">rot ${t.rotation}°</span></div>` : '<span class="muted">Select a rig part to test its pose.</span>';
    }
    if (els.poseList) {
      els.poseList.innerHTML = state.poseLibrary.map(p => `<div class="object-row${rowActive('pose',p.id)}" data-type="pose" data-id="${p.id}"><div class="object-main"><strong>${escapeHtml(p.name)}</strong><span>${Object.keys(p.transforms || {}).length} transform(s) | frame ${p.frame?.row ?? 0}:${p.frame?.col ?? 0}</span></div></div>`).join('') || '<span class="muted">No saved poses yet.</span>';
      wireObjectRows(els.poseList);
    }
  }

  function generateRemapPreview() {
    const target = els.remapLayoutSelect?.value || state.remap.target || 'godot_folders';
    state.remap.target = target;
    const plan = buildFrameManifest().map(f => ({ ...f, targetLayout: target, targetPath: remapPath(target, f) }));
    state.remap.plan = plan;
    renderRemapPreview();
    toast(`Generated ${plan.length} remap entries for ${target}.`, 'ok');
  }
  function remapPath(target, frame) {
    const base = safeName(state.grid.baseName || 'sprite');
    const row = safeName(frame.label || `row_${frame.row+1}`);
    const col = String(frame.col + 1).padStart(2, '0');
    if (target === 'godot_folders') return `godot/${row}/${row}_${col}.png`;
    if (target === 'rpg_maker_mz') return `rpg_maker_mz/${base}_${String(frame.row+1).padStart(2,'0')}_${col}.png`;
    if (target === 'lpc_idle_4dir') return `lpc_idle/${row}/${row}_${col}.png`;
    if (target === 'keter_runtime') return `keter/animations/${row}/${base}_${row}_${col}.png`;
    return `frames/${row}/${base}_${row}_${col}.png`;
  }
  function exportRemapPlan() { if (!state.remap.plan?.length) generateRemapPreview(); downloadJson('sheet_remap_plan_v6.json', state.remap); }
  function renderRemapPreview() {
    if (!els.remapPreviewList) return;
    const rows = (state.remap.plan || []).slice(0, 80);
    els.remapPreviewList.innerHTML = rows.map(r => `<div class="remap-row"><span>${escapeHtml(r.label)} ${r.row}:${r.col}</span><span>${escapeHtml(r.targetPath)}</span></div>`).join('') || '<span class="muted">Generate a remap plan to preview target paths.</span>';
  }

  function packAtlas() {
    state.atlas.manifest = buildAtlasManifest();
    state.atlas.frames = state.atlas.manifest.frames;
    renderAtlasPreview();
    toast(`Atlas preview packed: ${state.atlas.frames.length} frames.`, 'ok');
  }
  function buildAtlasManifest() {
    const padding = Number(state.atlas.padding ?? 2);
    const maxWidth = Math.max(Number(state.atlas.maxWidth ?? 1024), state.grid.frameW + padding * 2);
    let x = padding, y = padding, rowH = 0;
    const frames = [];
    for (const f of buildFrameManifest()) {
      const w = state.grid.frameW, h = state.grid.frameH;
      if (x + w + padding > maxWidth) { x = padding; y += rowH + padding; rowH = 0; }
      frames.push({ name: `${safeName(f.label)}_${String(f.col+1).padStart(2,'0')}`, source: f, atlas: { x, y, w, h } });
      x += w + padding;
      rowH = Math.max(rowH, h);
    }
    const width = maxWidth;
    const height = y + rowH + padding;
    return { version: VERSION, name: state.atlas.name || 'sprite_atlas', generatedAt: new Date().toISOString(), width, height, padding, frames };
  }
  function exportAtlasManifest() { if (!state.atlas.manifest) packAtlas(); downloadJson('atlas_manifest_v6.json', state.atlas.manifest); }
  function renderAtlasPreview() {
    if (!els.atlasPreviewList) return;
    const manifest = state.atlas.manifest;
    if (!manifest) { els.atlasPreviewList.innerHTML = '<span class="muted">Pack an atlas preview to see frame placement.</span>'; return; }
    els.atlasPreviewList.innerHTML = `<div class="atlas-cell"><span>${escapeHtml(manifest.name)} | ${manifest.width}×${manifest.height} | ${manifest.frames.length} frames</span><span class="atlas-pill">v6</span></div>` + manifest.frames.slice(0, 60).map(f => `<div class="atlas-cell"><span>${escapeHtml(f.name)}</span><span>${f.atlas.x},${f.atlas.y}</span></div>`).join('');
  }

  function buildRuntimeBundle() {
    const atlas = state.atlas.manifest || buildAtlasManifest();
    return {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      source: { name: state.source.name, width: state.source.width, height: state.source.height },
      grid: state.grid,
      exportProfile: state.profiles[state.export.profileId],
      frames: buildFrameManifest(),
      timeline: buildTimelineManifest(),
      pivots: state.pivots,
      parts: state.parts,
      atlas,
      remap: state.remap,
      qa: { summary: summarizeDiagnostics(), visualDiff: state.visualDiff }
    };
  }
  function exportRuntimeBundle() {
    state.runtimeBundle.lastBuilt = new Date().toISOString();
    const bundle = buildRuntimeBundle();
    downloadJson('runtime_bundle_v6.json', bundle);
    toast('Runtime bundle exported.', 'ok');
  }
  function exportRuntimeZip() {
    state.runtimeBundle.lastBuilt = new Date().toISOString();
    const files = [
      { name:'runtime/runtime_bundle.json', data:textBytes(pretty(buildRuntimeBundle())) },
      { name:'runtime/atlas_manifest.json', data:textBytes(pretty(state.atlas.manifest || buildAtlasManifest())) },
      { name:'runtime/timeline_clips.json', data:textBytes(pretty(buildTimelineManifest())) },
      { name:'runtime/remap_plan.json', data:textBytes(pretty(state.remap.plan || [])) },
      { name:'runtime/pose_library.json', data:textBytes(pretty(state.poseLibrary || [])) }
    ];
    downloadBlob(createZip(files), 'runtime_bundle_v6.zip');
  }

  function runTimelineValidator(markSource = true) {
    const add = (status, message) => state.qa.diagnostics.push({ status, message, source: 'Timeline Lab' });
    if (!state.timeline.clips.length) { add('warning', 'No timeline clips have been created. Runtime export will fall back to row-based clips.'); return; }
    for (const clip of state.timeline.clips) {
      if (!clip.frames?.length) add('fail', `Timeline clip ${clip.name} has no frames.`);
      if (clip.row < 0 || clip.row >= state.grid.rows) add('fail', `Timeline clip ${clip.name} references row ${clip.row}, outside the current grid.`);
      const bad = (clip.frames || []).filter(f => f < 0 || f >= state.grid.cols);
      if (bad.length) add('fail', `Timeline clip ${clip.name} has out-of-range frame columns: ${bad.join(', ')}.`);
      const durations = clip.durations || [];
      if (durations.some(d => d <= 0)) add('fail', `Timeline clip ${clip.name} has zero/negative frame duration.`);
      const min = Math.min(...durations), max = Math.max(...durations);
      if (Number.isFinite(min) && Number.isFinite(max) && max > min * 3) add('warning', `Timeline clip ${clip.name} has large duration variance (${min}-${max}ms).`);
      if (!bad.length && clip.frames?.length) add('pass', `Timeline clip ${clip.name} is valid.`);
    }
  }

})();
