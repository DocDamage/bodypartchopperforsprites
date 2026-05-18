import { createDiagnostic, maxRange } from './diagnostics.js';

export function buildVisualDiffSummary({ grid, frameBoxes = [] } = {}) {
  const rows = [];
  const rowCount = grid?.rows || 0;
  const colCount = grid?.cols || 0;

  for (let row = 0; row < rowCount; row += 1) {
    const boxes = [];
    for (let col = 0; col < colCount; col += 1) {
      const box = frameBoxes.find((item) => item.row === row && item.col === col) || { row, col, empty: true, x: 0, y: 0, w: 0, h: 0 };
      boxes.push(box);
    }

    const visible = boxes.filter((box) => !box.empty);
    const centers = visible.map((box) => box.x + box.w / 2);
    const widths = visible.map((box) => box.w);
    const heights = visible.map((box) => box.h);

    rows.push({
      row,
      label: grid?.rowLabels?.[row] || `row_${row + 1}`,
      empty: boxes.filter((box) => box.empty).length,
      centerDrift: maxRange(centers),
      widthDrift: maxRange(widths),
      heightDrift: maxRange(heights),
      boxes
    });
  }

  return rows;
}

export function validateVisualDiff(summary = [], options = {}) {
  const diagnostics = [];
  const source = options.source || 'visual_diff';
  const centerLimit = options.centerLimit ?? 4;
  const heightLimit = options.heightLimit ?? 8;
  const add = (severity, title, message) => diagnostics.push(createDiagnostic(severity, title, message, { source }));

  if (!summary.length) {
    add('warning', 'Visual diff skipped', 'No visual diff summary data was provided.');
    return diagnostics;
  }

  for (const row of summary) {
    if (row.centerDrift > centerLimit) {
      add('warning', `Center drift: ${row.label}`, `Frame center changes by ${row.centerDrift.toFixed(1)} px across this row.`);
    }
    if (row.heightDrift > heightLimit) {
      add('warning', `Height drift: ${row.label}`, `Bounding-box height changes by ${row.heightDrift.toFixed(1)} px across this row.`);
    }
    if (row.empty) {
      add('warning', `Empty cells: ${row.label}`, `${row.empty} empty frame(s) found in this row.`);
    }
  }

  if (!diagnostics.length) {
    add('pass', 'Visual diff passed', 'No significant center, height, or empty-frame drift was found.');
  }

  return diagnostics;
}

export function buildVisualDiffMarkdown(summary = [], generatedAt = new Date().toISOString()) {
  return `# Visual QA Diff Report\n\nGenerated: ${generatedAt}\n\n| Row | Label | Empty | Center Drift | Width Drift | Height Drift |\n|---:|---|---:|---:|---:|---:|\n${summary.map((row) => `| ${row.row} | ${row.label} | ${row.empty} | ${row.centerDrift.toFixed(1)} | ${row.widthDrift.toFixed(1)} | ${row.heightDrift.toFixed(1)} |`).join('\n')}\n`;
}
