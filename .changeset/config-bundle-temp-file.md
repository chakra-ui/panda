---
'@pandacss/config': patch
---

Fix config loading failing with `The argument 'filename' must be a file URL … Received 'data:…'` when the config imports
a CommonJS preset that uses `require()` (e.g. `pandacss-preset-typography`).

The bundled config is now evaluated from a temporary file (imported via a `file://` URL) instead of a `data:` URL, so
rolldown's `createRequire(import.meta.url)` interop resolves against a real path. Falls back to a `data:` URL when the
temp file can't be written. This also loads faster for larger configs.
