---
'@pandacss/compiler': patch
---

Fix `removeUnusedKeyframes` dropping keyframes used in a `globalCss` rule whose selector matches a shorthand, like `p` or `h`.
