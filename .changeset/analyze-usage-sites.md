---
'@pandacss/compiler-shared': patch
'@pandacss/cli': patch
---

Fix `panda analyze` listing CSS keys from a local `cva` or `sva` body as recipes, and add a flat `usages` list to the
JSON report so scripts can answer "who uses this token" without joining tables.
