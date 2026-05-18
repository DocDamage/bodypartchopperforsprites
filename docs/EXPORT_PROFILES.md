# Export Profiles

Export profiles define how sliced frames, manifests, pivots, timeline clips, atlases, runtime bundles, reports, and recipe data should be named and organized.

## Built-in profiles

| Profile | Target |
|---|---|
| `generic` | Generic PNG frames plus JSON manifest. |
| `godot4` | Godot 4 `AnimatedSprite2D` / animation metadata workflow. |
| `unity2d` | Unity 2D sprite folder and normalized pivot hints. |
| `rpgmz` | RPG Maker MZ-oriented frame organization and notes. |
| `keter` | KeterEngine atlas, clip, and pivot manifest output. |
| `lpc` | Universal LPC-style row and layer layout output. |

## Profile fields

```json
{
  "id": "keter",
  "name": "KeterEngine JSON",
  "folder": "keter/frames/{row}",
  "file": "{base}_{row}_{col}",
  "manifest": "keter_atlas.json",
  "pivotFormat": "pixels",
  "scale": 1,
  "folderByRow": true
}
```

## Naming tokens

| Token | Meaning |
|---|---|
| `{base}` | Base export name from the Sheet panel. |
| `{row}` | Row label, usually animation/direction. |
| `{col}` | Frame number or frame column. |
| `{direction}` | Direction label when available. |
| `{animation}` | Animation label when available. |

## Export preview rule

Every exporter should be able to generate a preview structure before writing files. This lets the user catch bad folder names, missing labels, or wrong profiles before generating a large ZIP.

## Runtime bundle

The v6 runtime bundle should include:

- source/project metadata
- frame records
- timeline clips
- pivots/sockets
- atlas metadata
- export profile
- QA summary

Suggested file name:

```text
runtime_bundle_v6.json
```

## KeterEngine target shape

For KeterEngine, prioritize stable JSON:

```text
keter/frames/{row}/{base}_{row}_{col}.png
keter/keter_atlas.json
keter/keter_animation_clips.json
keter/keter_pivots.json
keter/runtime_bundle_v6.json
```

## Production rule

An export profile should not mutate the project. It should only read project data, generate preview metadata, validate, then write output files.
