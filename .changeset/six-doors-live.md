---
'@pandacss/preset-base': patch
'@pandacss/generator': patch
---

Fix issue where `scrollbarGutter` property incorrectly referenced spacing tokens. The only valid values are `auto`,
`stable`, and `both-edges`.
