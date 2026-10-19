---
'@pandacss/compiler': patch
---

Fix `removeUnusedKeyframes` dropping keyframes used under `globalCss` selectors like `p` or `h`.
