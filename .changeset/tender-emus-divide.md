---
"@pandacss/dev": patch
"@pandacss/core": patch
"@pandacss/fixture": patch
"@pandacss/generator": patch
"@pandacss/node": patch
"@pandacss/types": patch
"playground": patch
"website": patch
---

[BREAKING] Removed the legacy `config.optimize` option because it was redundant. Now, we always optimize the generated CSS where possible.
