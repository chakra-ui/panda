---
'@pandacss/cli': patch
'@pandacss/compiler': patch
'@pandacss/config': patch
---

`panda lib` publishes machine artifacts under `./panda/*`. Manifest `files` stay relative to the lib outdir. Overlay gates on `jsxFactory`, and only virtualizes recipe/pattern runtimes when the design system owns that category.
