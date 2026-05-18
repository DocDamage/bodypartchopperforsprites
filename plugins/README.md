# Plugin Architecture Notes

V5 ships with an internal plugin registry in `app.js` so the app still works from a local `file://` URL. The files in this folder document the intended extension points for future external modules.

Plugin types:

- `importer`: loads source sheets or asset packs
- `exporter`: writes engine-specific packages
- `validator`: adds QA checks
- `batch`: processes queued sheets
- `migration`: normalizes project schemas
