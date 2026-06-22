---
'@pandacss/compiler': patch
---

`styled-system/types/index` now re-exports `./jsx` for all JSX frameworks, not just React. Solid, Vue, Preact, and Qwik generated `types/jsx` but never re-exported it, which could cause "inferred type cannot be named" TypeScript errors.
