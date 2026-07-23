---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/compiler-shared': minor
'@pandacss/cli': patch
---

Fix CSS ordering, selector emission, token pruning, conditional JSX spreads, and design-system tree-shaking.
`getSplitCss()` now returns `{ files, diagnostics }` instead of `CssFile[]` and includes the same diagnostics as merged
builds.
