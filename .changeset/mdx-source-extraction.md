---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix style extraction from `.mdx` files in `include`. Extract live JSX style props and `css()` calls while skipping
Markdown code examples.
