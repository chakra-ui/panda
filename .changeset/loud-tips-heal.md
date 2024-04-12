---
'@pandacss/parser': patch
'@pandacss/core': patch
---

Fix Panda imports detection when using `tsconfig`.`baseUrl` with an outdir that starts with `./`.
