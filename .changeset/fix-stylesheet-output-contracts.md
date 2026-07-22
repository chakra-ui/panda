---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/compiler-shared': minor
'@pandacss/cli': patch
---

Fix cascade, selector, token-pruning, and split-output edge cases. This changes `getSplitCss()` from a `CssFile[]` to `{ files, diagnostics }`, so split builds expose the same complete diagnostic set as merged builds.
