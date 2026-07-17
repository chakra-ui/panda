---
'@pandacss/config': patch
'@pandacss/compiler': patch
'@pandacss/cli': patch
---

`panda lib` omits inferred fallback `files` that package.json `"files"` would not publish, and warns with a `--files` tip for dist-only packages.
