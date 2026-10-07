---
'@pandacss/compiler': patch
---

Fix `staticCss` ignoring a custom utility's `transform`. Values generated through `staticCss.css` or
`staticCss.patterns` now emit the transformed styles instead of `example: b`.
