---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `styled()` emitting component defaults such as `srcDoc` as CSS, which could break Storybook and other CSS builds.

Restore extraction for `styled.tag()` options, conditional recipe defaults, and custom CSS keys in JSX spreads.
