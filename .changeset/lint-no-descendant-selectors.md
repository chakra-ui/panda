---
'@pandacss/eslint-plugin': minor
---

Add an opt-in `no-descendant-selectors` rule that flags selectors styling other elements (`& > li`, `.foo &`),
keeping every style scoped to its own element. Cross-element state stays available through conditions like
`_groupHover`.
