---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Keep the component when transforming JSX elements listed in a recipe's `jsx` option. That list tracks elements so their
variants reach the stylesheet — the component is yours, and replacing `<Button size="sm" />` with a `div` dropped
whatever it rendered. The element and its variant props now stay put; only style props fold into `className`.
