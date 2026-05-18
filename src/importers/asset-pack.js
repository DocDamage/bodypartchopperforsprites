import { CATEGORIES, safeName } from '../core/constants.js';

export function parseCreditsCsv(text = '') {
  const lines = String(text).split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines.shift()).map((header) => normalizeHeader(header));
  return lines.map((line) => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => { row[header] = values[index] || ''; });
    return row;
  });
}

export function splitCsvLine(line = '') {
  const result = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((value) => value.trim());
}

export function normalizeHeader(value) {
  return safeName(value).replace(/-/g, '_');
}

export function inferCategoryFromName(name = '') {
  const normalized = String(name).toLowerCase();
  return CATEGORIES.find((category) => normalized.includes(category) || normalized.includes(category.replace(/s$/, ''))) || 'other';
}

export function buildAssetRecord({ fileName, dataUrl = '', width = 0, height = 0, metadata = {}, credit = {}, idFactory = defaultIdFactory }) {
  const stem = String(fileName || 'asset').replace(/\.[^.]+$/, '');
  const category = metadata.category || inferCategoryFromName(fileName);
  return {
    id: metadata.id || idFactory('asset'),
    name: metadata.name || stem,
    category,
    dataUrl,
    thumb: dataUrl,
    frameSize: Math.max(width, height),
    directions: metadata.directions || [],
    animations: metadata.animations || [],
    zOrder: metadata.zOrder || 100,
    creator: metadata.creator || credit.creator || 'DocDamage',
    license: metadata.license || credit.license || 'private',
    sourceUrl: metadata.sourceUrl || credit.source_url || credit.sourceUrl || '',
    notes: metadata.notes || credit.notes || `Imported asset: ${fileName}`,
    tags: metadata.tags || [category]
  };
}

export function matchMetadataForFile(metadata = {}, fileName = '') {
  const stem = fileName.replace(/\.[^.]+$/, '');
  if (Array.isArray(metadata.assets)) {
    return metadata.assets.find((item) => item.file === fileName || item.name === stem) || {};
  }
  return metadata[stem] || metadata[fileName] || {};
}

export function matchCreditForFile(credits = [], fileName = '') {
  const stem = fileName.replace(/\.[^.]+$/, '');
  return credits.find((row) => row.name === stem || row.file === fileName || row.filename === fileName) || {};
}

function defaultIdFactory(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
