---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
---

`css()` and JSX style props can resolve simple pure helpers — local or imported arrow functions, function declarations,
and IIFEs. `token()` comparisons inside those helpers resolve too.

```ts
const pad = (n: number) => ({ padding: `${n}px` })
css(pad(4)) // extracted
```
