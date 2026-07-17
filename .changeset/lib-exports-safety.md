---
'@pandacss/config': patch
'@pandacss/compiler': patch
---

`panda lib` no longer silently loses or clobbers package.json `exports`. An array-form root export is preserved (under `"."`) instead of dropped, and overwriting a subpath whose value differs from Panda's now emits a warning naming the overwritten path.
