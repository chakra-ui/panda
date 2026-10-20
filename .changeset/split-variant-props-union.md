---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix recipe types: `splitVariantProps` keeps union props and checks variant values, config recipe `raw()` returns its
variant props, and `cva()` / `sva()` results expose `config`.

```ts
const [, rest] = button.splitVariantProps(props) // rest stays a union
const args = { ...button.raw({ size: 'lg' }), title: 'Hi' } // raw returns { size: 'lg' }
```
