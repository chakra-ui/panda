---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
---

Fix conditional tokens resolving to a raw token name or one condition's value. Token-backed utilities and `token()` now
use the token's CSS variable, including semantic tokens without `base`.
