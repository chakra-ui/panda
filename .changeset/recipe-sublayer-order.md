---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

With the Vite, PostCSS, webpack, or Bun plugins, your stylesheet only needs the top-level layer order. Slot recipes no
longer override recipe variants:

```css
@layer reset, base, tokens, recipes, utilities;
```

If you added `@layer recipes.base, …` lines as a workaround, you can remove them.
