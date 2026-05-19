export function buildRpgMakerSheet(session, sourceImage, options = {}) {
  // RPG Maker MZ/MV character sheets are 12×8 grids of 48×48 cells
  // This exporter repacks detected frames into a standard MZ sheet where possible
  const cellW = options.cellW || 48;
  const cellH = options.cellH || 48;
  const cols = 12;
  const rows = 8;
  const sheetW = cols * cellW;
  const sheetH = rows * cellH;

  const activeObjects = session.objects.filter(o => !o.ignored && o.class === 'character_frame');
  const sheets = [];
  let currentSheet = [];

  for (const obj of activeObjects) {
    if (currentSheet.length >= cols * rows) {
      sheets.push(currentSheet);
      currentSheet = [];
    }
    currentSheet.push(obj);
  }
  if (currentSheet.length) sheets.push(currentSheet);

  const output = [];
  for (let s = 0; s < sheets.length; s++) {
    const canvas = document.createElement('canvas');
    canvas.width = sheetW;
    canvas.height = sheetH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.clearRect(0, 0, sheetW, sheetH);

    for (let i = 0; i < sheets[s].length; i++) {
      const obj = sheets[s][i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const [sx, sy, sw, sh] = obj.trimmed_bbox;
      const dx = col * cellW + Math.max(0, Math.floor((cellW - sw) / 2));
      const dy = row * cellH + Math.max(0, Math.floor((cellH - sh) / 2));
      ctx.drawImage(sourceImage, sx, sy, sw, sh, dx, dy, sw, sh);
    }

    output.push({
      name: `rpg_maker_mz_sheet_${String(s).padStart(2, '0')}.png`,
      dataUrl: canvas.toDataURL('image/png'),
      notes: `Sheet ${s + 1}: ${sheets[s].length} frames. RPG Maker MZ expects 12×8 grid at 48×48 per cell.`
    });
  }

  return { sheets: output, cellW, cellH, cols, rows };
}
