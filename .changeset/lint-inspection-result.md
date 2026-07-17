---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/compiler-shared': patch
---

`inspectFileSource` now returns lint-friendly style entries, token refs, JSX entries, and fixable source spans for `css()`, style props, and recipes. `compiler.spec()` adds richer deprecation data; `compiler.suggestToken(prop, value)` suggests a token for a hardcoded value.
