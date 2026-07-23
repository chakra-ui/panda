---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/compiler-shared': minor
'@pandacss/cli': patch
---

Fix CSS cascade order, token pruning, and conditional JSX spreads where a later static prop overrides a spread. Design-system
tree-shaking now runs before every CSS read/write path, not only `cssgen` / `writeCss`.

`getSplitCss()` is a breaking shape change for direct callers:

```ts
// before
const files = compiler.getSplitCss()

// after
const { files, diagnostics } = compiler.getSplitCss()
```
