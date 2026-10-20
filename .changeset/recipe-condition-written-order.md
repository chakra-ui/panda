---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix recipe conditions ignoring the order you write them. When two conditions match the same element, like `_dark` and
`&[data-active]`, the one written last wins again, as in v1. Interaction states still sort hover, then focus, then
active.
