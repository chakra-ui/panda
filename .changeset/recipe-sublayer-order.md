---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix slot recipe styles overriding recipe variants and compound variants when a bundler plugin (Vite, PostCSS, webpack,
Bun) adds Panda's CSS. Your stylesheet only needs the top-level layer order:

```css
@layer reset, base, tokens, recipes, utilities;
```
