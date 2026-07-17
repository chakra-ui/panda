---
'@pandacss/config': patch
---

`panda lib` resolves `npm:` peer aliases (like `npm:@pandacss/dev@^3.0.0`) into a real `panda` range in the manifest, same as `workspace:` and `catalog:`.
