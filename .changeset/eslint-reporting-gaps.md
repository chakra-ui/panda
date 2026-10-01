---
'@pandacss/eslint-plugin': patch
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `prefer-token` false positives for token-valued ternaries and utilities such as `flex`. Report unknown condition warnings through `extraction-diagnostics` in ESLint and Oxlint.
