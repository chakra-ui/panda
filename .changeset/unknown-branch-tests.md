---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix styles being dropped when a condition reads a variable set by a ternary, such as `tone === 'quiet' ? 'blue.500' : 'orange.500'` after `const tone = loud ? 'loud' : 'quiet'`. Both branches are now extracted, including through `??`/`||` defaults, helper functions, and imports.
