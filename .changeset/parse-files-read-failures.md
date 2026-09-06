---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

`parseFiles` now returns a report for every requested path. A file that cannot be read keeps its last parsed styles and
reports a `source_not_found` or `source_read_failed` warning instead of being silently skipped.
