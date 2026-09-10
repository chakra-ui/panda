---
'@pandacss/compiler': patch
---

Source transforms now fold a `styled()` chain to the element it was built with when `jsxFactory` is renamed. A
`panda('button', { base })` component used as `<Button>` becomes a `<button>`, not a `<div>`.
