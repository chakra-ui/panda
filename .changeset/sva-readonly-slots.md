---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

You can pass a readonly `slots` array to `sva()` again. A `slots` array declared `as const` no longer fails with TS4104,
so you can reuse it in your own types:

```ts
const slots = ['root', 'label'] as const
type Slot = (typeof slots)[number]

const field = sva({ slots, base: { root: { color: 'red' }, label: { color: 'blue' } } })
```
