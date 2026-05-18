# Doc Sprite Slicer Studio v6

V5 is the cumulative release-candidate foundation. It includes V1-V4 functionality and adds production hardening: plugin registry, project migration, asset-pack import, visual QA diff, batch logs, export previews, recovery packages, and stronger project schema handling.

Open `index.html` in a browser, import a spritesheet, then use the top menus, right-click actions, inspectors, and Ctrl+K command palette.

## V5 focus

- Keep the UI clean and canvas-first.
- Move advanced actions into menus and context menus.
- Make exporters, validators, importers, and batch steps discoverable as plugins.
- Preserve old project compatibility through migration.
- Make recovery and backups hard to ignore.

## Main new workflows

1. **Tools > Plugin Manager** to manage internal plugin modules.
2. **Tools > Asset Pack Importer** to ingest PNGs plus optional metadata JSON/credits CSV.
3. **Tools > Run Visual QA Diff** to find frame drift.
4. **Tools > Export Preview JSON** to inspect output structure before exporting.
5. **Tools > Export Recovery Package** to package autosaves and recovery data.

## Workspace ZIP now includes

- project snapshot
- frame exports
- rig parts
- plugin manifest/settings
- export preview
- visual QA diff
- batch logs
- recipes
- asset library
- credits


## V6 Additions

- Animation Lab with timeline clips and onion-skin review
- Pose Lab for deterministic rig-part transform snapshots
- Sheet Remapper for layout conversion plans
- Atlas Lab for runtime atlas manifests
- Runtime bundle JSON/ZIP exports
- Timeline QA validator

Start with `index.html`. Open the More menu for Timeline, Pose, Remap, and Atlas modes.
