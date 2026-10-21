---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix source transforms reading a pattern's `.raw()` props as styles when it's passed to `css()`, like `css(fade.raw({ inset: 56 }), { overflowX: 'auto' })`. The transform now runs the pattern, so the classes match the generated CSS.

Patterns without a `transform` now emit CSS, and `defaultValues` now apply to `pattern.raw()` inside `css()`.
