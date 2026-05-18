# V4 Project Schema

A `.spriteproject.json` file contains:

```json
{
  "type": "doc_sprite_slicer_studio_project",
  "version": "4.0.0",
  "source": {
    "name": "sheet.png",
    "dataUrl": "data:image/png;base64,...",
    "width": 832,
    "height": 1344
  },
  "grid": {
    "cols": 13,
    "rows": 21,
    "frameW": 64,
    "frameH": 64,
    "rowLabels": [],
    "directionLabels": []
  },
  "parts": [],
  "pivots": [],
  "library": [],
  "recipe": {},
  "batch": [],
  "profiles": {},
  "qa": {}
}
```

Large embedded source images can make project files large. Disable "Include source" in Export mode for lightweight project snapshots.
