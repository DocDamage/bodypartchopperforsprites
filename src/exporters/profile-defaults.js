export const DEFAULT_PROFILES = Object.freeze({
  generic: { id: 'generic', name: 'Generic PNG + JSON', folder: 'frames/{row}', file: '{base}_{row}_{col}', manifest: 'manifest.json', pivotFormat: 'generic', scale: 1, folderByRow: true },
  godot4: { id: 'godot4', name: 'Godot 4 AnimatedSprite2D', folder: 'godot/animations/{row}', file: '{row}_{col}', manifest: 'godot_animations.json', pivotFormat: 'godot', scale: 1, folderByRow: true },
  unity2d: { id: 'unity2d', name: 'Unity 2D', folder: 'unity/sprites/{row}', file: '{base}_{row}_{col}', manifest: 'unity_sprite_manifest.json', pivotFormat: 'normalized', scale: 1, folderByRow: true },
  rpgmz: { id: 'rpgmz', name: 'RPG Maker MZ', folder: 'rpgmaker_mz/{row}', file: '{base}_{row}_{col}', manifest: 'rpgmaker_mz_notes.json', pivotFormat: 'none', scale: 1, folderByRow: true },
  keter: { id: 'keter', name: 'KeterEngine JSON', folder: 'keter/frames/{row}', file: '{base}_{row}_{col}', manifest: 'keter_atlas.json', pivotFormat: 'pixels', scale: 1, folderByRow: true },
  lpc: { id: 'lpc', name: 'Universal LPC Style', folder: 'lpc/{row}', file: '{row}_{col}', manifest: 'lpc_layer_manifest.json', pivotFormat: 'pixels', scale: 1, folderByRow: true }
});
