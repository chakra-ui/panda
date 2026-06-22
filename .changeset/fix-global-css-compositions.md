---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `globalCss` and token-reference parity with extracted styles.

- Expand composition props and nested utility transforms in `globalCss`.
- Resolve token references in raw at-rule conditions.
- Preserve `token(path, fallback)` fallbacks in emitted CSS variables.
