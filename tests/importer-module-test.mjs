import { buildAssetRecord, inferCategoryFromName, matchCreditForFile, matchMetadataForFile, parseCreditsCsv, splitCsvLine } from '../src/importers/asset-pack.js';
import { buildGridForSource, buildSourceRecord, isSupportedImageFileName, isSupportedMetadataFileName, sourceBaseName } from '../src/importers/spritesheet.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

assert(splitCsvLine('"Ronin, Hair",DocDamage,private')[0] === 'Ronin, Hair', 'splitCsvLine preserves quoted comma');
const credits = parseCreditsCsv('name,creator,license\nRonin Hair,DocDamage,private');
assert(credits[0].creator === 'DocDamage', 'parseCreditsCsv reads creator');
assert(inferCategoryFromName('dark_weapons_katana.png') === 'weapons', 'inferCategoryFromName detects category');
assert(matchMetadataForFile({ assets: [{ file: 'hair.png', category: 'hair' }] }, 'hair.png').category === 'hair', 'matchMetadataForFile matches asset list');
assert(matchCreditForFile([{ file: 'hair.png', license: 'private' }], 'hair.png').license === 'private', 'matchCreditForFile matches credit rows');
const asset = buildAssetRecord({ fileName: 'hair.png', dataUrl: 'data:image/png;base64,test', width: 16, height: 32, metadata: { category: 'hair' }, idFactory: () => 'asset_1' });
assert(asset.id === 'asset_1' && asset.frameSize === 32 && asset.category === 'hair', 'buildAssetRecord creates normalized asset');

const source = buildSourceRecord({ name: 'ronin.png', dataUrl: 'data:image/png;base64,test', width: 832, height: 256 });
assert(source.name === 'ronin.png' && source.width === 832, 'buildSourceRecord creates source metadata');
const grid = buildGridForSource({ width: 832, height: 256, currentGrid: { directionLabels: ['up', 'left', 'down', 'right'] } });
assert(grid.frameW === 64 && grid.cols === 13 && grid.rows === 4, 'buildGridForSource detects LPC grid');
assert(sourceBaseName('The Ronin.png') === 'the_ronin', 'sourceBaseName normalizes filenames');
assert(isSupportedImageFileName('sprite.webp'), 'image file support detects webp');
assert(isSupportedMetadataFileName('credits.csv'), 'metadata file support detects csv');

if (process.exitCode) process.exit(process.exitCode);
