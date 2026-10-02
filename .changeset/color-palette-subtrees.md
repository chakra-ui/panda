---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

`colorPalette.include` and `exclude` now pick palettes by name, and each palette keeps all of its tokens. Themes with
many nested groups can drop nested palettes from the `strictTokens` union without losing any virtual token:

```ts
export default defineConfig({
  theme: {
    // `gray` stays a palette with colorPalette.1 and colorPalette.solid.bg; `gray.solid` is dropped
    colorPalette: { exclude: ['*.*'] },
  },
})
```
