---
'@pandacss/config': patch
---

A CommonJS preset default-imported in a `"type": "module"` project now fails with a clear error instead of being ignored
or crashing with `__toESM(...).default is not a function`. Use the import's `.default`, or publish the preset as ESM.
