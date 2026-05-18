# Project Format

Doc Sprite Slicer Studio saves projects as JSON files using the `.spriteproject.json` extension.

## Current format

```json
{
  "type": "doc_sprite_slicer_studio_project",
  "version": "6.0.0",
  "projectFormatVersion": 6
}
```

## Important top-level fields

| Field | Purpose |
|---|---|
| `source` | Source image metadata and optional embedded data URL. |
| `grid` | Columns, rows, frame size, margins, spacing, row labels, direction labels, and base name. |
| `view` | Canvas display options like grid, numbers, bounding boxes, pivots, underlap guides, and zoom. |
| `export` | Active profile, scale, smoothing, folder behavior, and package options. |
| `qa` | Export gate settings and last diagnostics. |
| `parts` | Rig-prep masks, rectangles, polygons, categories, frame assignment, and underlap values. |
| `pivots` | Pivot/socket records for feet, hands, head, weapon sockets, and root anchors. |
| `library` | Optional embedded asset library records when exported with library data. |
| `recipe` | Character recipe data: asset layers, profile, palette, and direction overrides. |
| `batch` | Batch queue items. |
| `profiles` | Export profile definitions. |
| `pluginsEnabled` | Enabled/disabled state for internal plugins. |
| `timeline` | Timeline clips, selected clip, and onion-skin options. |
| `poseLibrary` | Saved pose/transform test snapshots. |
| `remap` | Sheet remap target and generated plan. |
| `atlas` | Atlas packing settings and generated manifest. |
| `runtimeBundle` | Last runtime bundle metadata. |

## Migration policy

The app should normalize older projects into the current format instead of rejecting them.

Expected migration behavior:

1. Preserve known fields.
2. Add missing v6 defaults.
3. Keep unknown fields unless they break runtime behavior.
4. Record migration notes in `migrationReport`.
5. Never mutate the original project file silently; save a new file after migration.

## Source image embedding

If `export.includeSource` is enabled, project saves include the source image as a data URL. This makes project files portable but larger. If disabled, the project file keeps only source metadata, and the user must re-import the source image later.

## Safety rule

A project file is the source of truth for grid settings, rig parts, pivots, recipes, plugins, QA gates, and export profiles. Exported PNGs should be considered build artifacts, not editable source data.
