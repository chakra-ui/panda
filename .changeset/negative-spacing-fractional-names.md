---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix negative spacing tokens for names containing a dot. `spacing.0.5` now generates `spacing.-0.5` instead of
`spacing.0.-5`, so `mt: '-0.5'` resolves. Spacing tokens whose value is zero in any unit (`0`, `0px`, `0%`) no longer
get a meaningless negative twin.
