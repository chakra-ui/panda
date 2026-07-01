---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/compiler-shared': patch
---

Expose lint-friendly compiler inspection data.

`inspectFileSource` now reports style entries, token references, JSX entries, and safe source spans for fixes across
`css()`, style props, JSX `css`, and recipe styles. `compiler.spec()` also exposes richer deprecation data, and
`compiler.suggestToken(prop, value)` can suggest a token for a hardcoded value.
