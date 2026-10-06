---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Add style extraction for `.mdx` files in `include`. Panda now extracts JSX style props and `css()` calls from MDX while
skipping code examples in Markdown.
