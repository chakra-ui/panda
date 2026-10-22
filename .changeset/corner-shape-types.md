---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Add `cornerShape` (and its per-corner variants), `baselineSource` and `dynamicRangeLimit` to the generated types.

```ts
css({ borderRadius: '50%', cornerShape: 'squircle' })
```
