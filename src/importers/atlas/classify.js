export const OBJECT_CLASSES = Object.freeze([
  'character_frame',
  'projectile_fx',
  'impact_fx',
  'status_fx',
  'cast_fx',
  'portrait',
  'mugshot',
  'palette_strip',
  'palette_variant_frame',
  'text_label',
  'annotation_arrow',
  'divider_line',
  'panel_border',
  'section_box',
  'unknown',
  'ignored'
]);

export function classifyObjects(components, analysis, preset) {
  const sheetType = analysis.sheet_type_guess;
  const avgScale = analysis.estimated_average_scale || 32;
  const imgW = analysis.width;
  const imgH = analysis.height;

  return components.map(comp => {
    const [x, y, w, h] = comp.source_bbox;
    const area = comp.area;
    const ar = comp.aspect_ratio;

    let cls = 'unknown';
    let confidence = 0.5;

    // Portrait / mugshot heuristics
    if (preset.detectPortraits && w > avgScale * 1.5 && h > avgScale * 1.2 && area > avgScale * avgScale * 2) {
      if (y > imgH * 0.6 || x > imgW * 0.7) {
        cls = area > avgScale * avgScale * 4 ? 'portrait' : 'mugshot';
        confidence = 0.6;
      }
    }

    // Palette strip heuristics
    if (preset.paletteStripIgnore && h < Math.max(4, avgScale * 0.35) && w > avgScale * 2) {
      cls = 'palette_strip';
      confidence = 0.75;
    }

    // Text label / annotation heuristics
    if (preset.textIgnore && h < Math.max(6, avgScale * 0.5) && w > avgScale * 0.8 && ar > 2) {
      cls = 'text_label';
      confidence = 0.6;
    }

    // Divider line / panel border
    if (preset.dividerDetection && (h <= 2 || w <= 2) && (w > imgW * 0.3 || h > imgH * 0.3)) {
      cls = h <= 2 ? 'divider_line' : 'panel_border';
      confidence = 0.8;
    }

    // Annotation arrow (thin diagonal-ish)
    if (preset.ignoreThinAnnotations && area < avgScale * 2 && (ar > 4 || ar < 0.25)) {
      cls = 'annotation_arrow';
      confidence = 0.5;
    }

    // Projectile / FX (small, detached, often near edges or above main rows)
    if (preset.detectProjectileRows && area < avgScale * avgScale * 1.5 && (y < imgH * 0.3 || ar > 2.5)) {
      if (cls === 'unknown') {
        cls = 'projectile_fx';
        confidence = 0.5;
      }
    }

    // Default to character_frame for medium-sized sprites in the main area
    if (cls === 'unknown' && area >= avgScale * avgScale * 0.5 && area < avgScale * avgScale * 8) {
      cls = 'character_frame';
      confidence = 0.7;
    }

    return { ...comp, class: cls, confidence };
  });
}
