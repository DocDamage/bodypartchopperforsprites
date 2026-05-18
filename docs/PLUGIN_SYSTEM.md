# Plugin System

The v6 app has an internal plugin registry. This is not yet a dynamic third-party plugin loader. It is a structured way to keep importers, exporters, validators, migration hooks, animation tools, rig tools, remappers, and batch steps discoverable and toggleable.

## Current plugin categories

| Type | Role |
|---|---|
| `importer` | Brings images, spritesheets, asset packs, metadata, or credits into the app. |
| `exporter` | Produces PNGs, manifests, engine metadata, runtime bundles, or reports. |
| `validator` | Runs QA and project-integrity checks. |
| `batch` | Adds batch queue jobs and logs. |
| `migration` | Normalizes older project files into the current schema. |
| `animation` | Adds timeline, clip, frame-cycle, or onion-skin functionality. |
| `rig` | Adds pose testing, pivots, masks, or body-part workflow tools. |
| `remapper` | Converts one sheet layout plan into another export layout. |

## Plugin record shape

```json
{
  "id": "exporter.keter",
  "type": "exporter",
  "version": "1.0.0",
  "name": "KeterEngine Exporter",
  "description": "Builds KeterEngine atlas, animation clip, and pivot manifest data."
}
```

## Current behavior

Plugin enabled/disabled state is stored in browser local storage and project snapshots. UI actions should check plugin availability before exposing future plugin-specific advanced behavior.

## Next architecture target

The current app is still mostly monolithic. Future refactor should split plugins into modules:

```text
src/plugins/registry.js
src/plugins/importers/generic_spritesheet.js
src/plugins/importers/asset_pack.js
src/plugins/exporters/godot4.js
src/plugins/exporters/keter.js
src/plugins/validators/project_integrity.js
src/plugins/validators/visual_diff.js
src/plugins/migrations/v1_to_v6.js
```

## Rules for future plugins

1. Plugin IDs must be stable.
2. Plugins must declare type, version, name, and description.
3. Exporters must produce preview metadata before writing files.
4. Validators must return machine-readable results with `pass`, `warning`, or `failure` severity.
5. Migration plugins must never discard unknown user data without recording it.
6. Plugin UI should stay inside menus, inspectors, and context menus, not permanent canvas clutter.
