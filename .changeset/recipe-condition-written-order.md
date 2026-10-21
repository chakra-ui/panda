---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
---

Recipe conditions now follow the order you write them, so the one written last wins, including `_hover` and `_active`.

```ts
base: {
  _dark: { color: 'white' },
  '&[data-active]': { color: 'red' }, // written last, wins on an active element in dark mode
}
```
