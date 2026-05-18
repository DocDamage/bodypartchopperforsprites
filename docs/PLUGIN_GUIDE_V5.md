# Plugin Guide V5

V5 uses a built-in registry in `app.js` for local-browser compatibility. Future versions can move these entries into real dynamic modules when served over HTTP.

Plugin object shape:

```js
{
  id: 'validator.visual_diff',
  type: 'validator',
  version: '1.0.0',
  name: 'Visual QA Diff Validator',
  description: 'Checks center drift and bounding-box drift.'
}
```

Plugin types: `importer`, `exporter`, `validator`, `batch`, `migration`.
