export function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function collectRecipeAssets({ library = [], recipe = {} }) {
  const recipeLayers = recipe.layers || [];
  const recipeAssets = recipeLayers
    .map((layer) => library.find((asset) => asset.id === layer.assetId))
    .filter(Boolean);
  return recipeAssets.length ? recipeAssets : library;
}

export function buildCredits({ library = [], recipe = {} }) {
  const assets = collectRecipeAssets({ library, recipe });
  const rows = assets.map((asset) => ({
    name: asset.name || 'Unnamed Asset',
    creator: asset.creator || 'DocDamage',
    license: asset.license || 'private',
    sourceUrl: asset.sourceUrl || '',
    notes: asset.notes || ''
  }));

  const md = `# Credits\n\n${rows.map((row) => `- **${row.name}** — ${row.creator}; license: ${row.license}${row.sourceUrl ? `; source: ${row.sourceUrl}` : ''}${row.notes ? `; notes: ${row.notes}` : ''}`).join('\n') || 'No assets in library/recipe.'}\n`;

  const csv = [
    'name,creator,license,source_url,notes',
    ...rows.map((row) => [row.name, row.creator, row.license, row.sourceUrl, row.notes].map(csvEscape).join(','))
  ].join('\n');

  return { md, csv, rows };
}
