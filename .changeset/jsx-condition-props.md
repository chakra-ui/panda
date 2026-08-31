---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Treat condition props like `_hover`, CSS variables, and `&`/`@` selectors as style props on JSX components, so they become classes instead of DOM attributes.
