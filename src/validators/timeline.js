import { createDiagnostic } from './diagnostics.js';

export function validateTimeline({ timeline = {}, grid = {} } = {}, options = {}) {
  const diagnostics = [];
  const source = options.source || 'timeline';
  const add = (severity, title, message) => diagnostics.push(createDiagnostic(severity, title, message, { source }));
  const clips = timeline.clips || [];

  if (!clips.length) {
    add('warning', 'No timeline clips', 'Runtime export will fall back to row-based clips. Create timeline clips for explicit animation timing.');
    return diagnostics;
  }

  for (const clip of clips) {
    if (!clip.frames?.length) add('fail', `Timeline clip ${clip.name}`, 'Clip has no frames.');
    if (clip.row < 0 || clip.row >= (grid.rows || 0)) add('fail', `Timeline clip ${clip.name}`, `Clip references row ${clip.row}, outside the current grid.`);

    const badFrames = (clip.frames || []).filter((frame) => frame < 0 || frame >= (grid.cols || 0));
    if (badFrames.length) add('fail', `Timeline clip ${clip.name}`, `Out-of-range frame columns: ${badFrames.join(', ')}.`);

    const durations = clip.durations || [];
    if (durations.some((duration) => duration <= 0)) add('fail', `Timeline clip ${clip.name}`, 'Clip has zero or negative frame duration.');

    if (durations.length) {
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      if (Number.isFinite(min) && Number.isFinite(max) && max > min * 3) {
        add('warning', `Timeline clip ${clip.name}`, `Large duration variance detected (${min}-${max}ms).`);
      }
    }

    if (clip.frames?.length && !badFrames.length && clip.row >= 0 && clip.row < (grid.rows || 0)) {
      add('pass', `Timeline clip ${clip.name}`, 'Clip references valid row and frame columns.');
    }
  }

  return diagnostics;
}
