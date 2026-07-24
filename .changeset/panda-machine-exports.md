---
'@pandacss/cli': patch
'@pandacss/compiler': patch
'@pandacss/config': patch
---

`panda lib` publishes machine artifacts under `./panda/*`, with manifest `files` paths relative to the lib outdir.
Recipe/pattern runtime overlays only kick in when the design system owns that category.
