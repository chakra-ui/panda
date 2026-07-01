---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `globalCss` and token-reference parity with extracted styles.

`globalCss` now expands composition props and nested utility transforms, resolves token references in raw at-rules, and
preserves `token(path, fallback)` fallbacks.
