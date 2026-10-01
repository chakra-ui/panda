---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix recipe properties being overridden by a `textStyle`, `layerStyle`, or `animationStyle` in the same recipe. The
property you set directly now always wins:

```ts
// textStyles.body sets fontWeight: 'normal'
base: { textStyle: 'body', fontWeight: 'medium' } // now medium, was normal
```
