import { buildFrameManifest } from '../exporters/manifest.js';

export function buildAtlasManifest({ state, padding = null, maxWidth = null, name = null }) {
  const atlasPadding = Number(padding ?? state.atlas?.padding ?? 2);
  const atlasMaxWidth = Math.max(Number(maxWidth ?? state.atlas?.maxWidth ?? 1024), state.grid.frameW + atlasPadding * 2);
  const atlasName = name || state.atlas?.name || 'sprite_atlas';
  let x = atlasPadding;
  let y = atlasPadding;
  let rowHeight = 0;
  const frames = [];

  for (const frame of buildFrameManifest({ grid: state.grid, profiles: state.profiles, exportSettings: state.export })) {
    const width = state.grid.frameW;
    const height = state.grid.frameH;
    if (x + width + atlasPadding > atlasMaxWidth) {
      x = atlasPadding;
      y += rowHeight + atlasPadding;
      rowHeight = 0;
    }
    frames.push({
      name: `${safeAtlasName(frame.label)}_${String(frame.col + 1).padStart(2, '0')}`,
      source: frame,
      atlas: { x, y, w: width, h: height }
    });
    x += width + atlasPadding;
    rowHeight = Math.max(rowHeight, height);
  }

  return {
    name: atlasName,
    width: atlasMaxWidth,
    height: y + rowHeight + atlasPadding,
    padding: atlasPadding,
    frames
  };
}

export function summarizeAtlas(atlas) {
  return {
    name: atlas?.name || 'sprite_atlas',
    width: atlas?.width || 0,
    height: atlas?.height || 0,
    padding: atlas?.padding || 0,
    frameCount: atlas?.frames?.length || 0
  };
}

function safeAtlasName(value) {
  return String(value || 'frame').toLowerCase().replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'frame';
}
