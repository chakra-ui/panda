---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `token.var()` references for token keys containing dots, such as `spacing.1.5`, so they match the emitted CSS
variables, including when hashing is enabled.
