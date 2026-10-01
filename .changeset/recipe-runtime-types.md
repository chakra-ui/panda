---
'@pandacss/compiler': patch
---

Fix two recipe type regressions: slot recipe calls like `card().root` are typed as `string` again, and `variantMap`
arrays no longer include `undefined`.
