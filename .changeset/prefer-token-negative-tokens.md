---
'@pandacss/eslint-plugin': patch
'@pandacss/compiler': patch
---

Fix `prefer-token` reporting negative spacing tokens (`marginTop: '-2'`) and color opacity modifiers (`red.500/40`) as hardcoded values. `resolveUtilityValue()` now returns the `tokens` a value references.
